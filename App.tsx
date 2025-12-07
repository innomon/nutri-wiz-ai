import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { analyzeFoodImage, getChatResponse, generateSpeech } from './services/geminiService';
import { decodeAudioData, playAudioBuffer } from './utils/audioUtils';
import CameraView from './components/CameraView';
import NutriCard from './components/NutriCard';
import HistoryView from './components/HistoryView';
import ApiKeyModal from './components/ApiKeyModal';
import { Message, MessageType, AppState, NutritionalData } from './types';

// Icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a6 6 0 00-6 6v1.5a6 6 0 006 6v-1.5a6 6 0 006-6v-1.5a6 6 0 00-6-6z" />
  </svg>
);
const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 animate-pulse text-red-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
    </svg>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);
const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: MessageType.AI_TEXT,
      content: "Hi! Point your camera at some food and I'll analyze it for you. You can use your hand for scale.",
      timestamp: Date.now()
    }
  ]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [inputValue, setInputValue] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(true);
  
  // Store pending analysis data + image before saving to history
  const [previewItem, setPreviewItem] = useState<{ data: NutritionalData, imageBase64: string } | null>(null);
  
  const [showHistory, setShowHistory] = useState(false);
  const [isChatFullscreen, setIsChatFullscreen] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Swipe gesture state
  const touchStartY = useRef<number | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null); // Using any for SpeechRecognition

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatFullscreen]);

  // Check for API Key on mount
  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    if (!key) {
      setShowKeyModal(true);
    }
  }, []);

  const handleSaveKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setShowKeyModal(false);
  };

  const handleResetKey = () => {
    localStorage.removeItem('gemini_api_key');
    setShowKeyModal(true);
    setShowHistory(false);
  };

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Play text as speech
  const speakText = async (text: string) => {
    try {
        setAppState(AppState.SPEAKING);
        const audioBase64 = await generateSpeech(text);
        if (audioContextRef.current) {
            const buffer = await decodeAudioData(audioBase64, audioContextRef.current);
            playAudioBuffer(buffer, audioContextRef.current);
        }
    } catch (e) {
        console.error("TTS Error:", e);
    } finally {
        setAppState(AppState.IDLE);
    }
  };

  // Toggle Save Message (Recipe)
  const toggleSaveMessage = (id: string) => {
      setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, isSaved: !m.isSaved } : m
      ));
  };

  // Handle Image Capture
  const handleImageCapture = async (base64: string) => {
    initAudio();
    setIsCameraActive(false); // Briefly hide camera focus
    setAppState(AppState.ANALYZING);

    try {
      // 1. Analyze Image (Do NOT add to history yet)
      const data = await analyzeFoodImage(base64);
      
      // 2. Show Preview Modal
      setPreviewItem({ data, imageBase64: base64 });

      // 3. Speak Summary (Immediate feedback)
      await speakText(data.summary);

    } catch (error: any) {
      console.error(error);
      let errorText = "I had trouble analyzing that image. Please try again.";
      if (error.message === 'API_KEY_MISSING') {
         errorText = "API Key is missing. Please check settings.";
         setShowKeyModal(true);
      }

      const errorMsg: Message = {
        id: uuidv4(),
        type: MessageType.AI_TEXT,
        content: errorText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      if(error.message !== 'API_KEY_MISSING') {
        await speakText("I couldn't analyze that. Please try again.");
      }
    } finally {
      setAppState(AppState.IDLE);
      setIsCameraActive(true); 
    }
  };

  // Save Pending Preview to History
  const savePreview = () => {
    if (!previewItem) return;

    const { data, imageBase64 } = previewItem;

    // Add Image to History
    const userMsgId = uuidv4();
    const newUserMsg: Message = {
      id: userMsgId,
      type: MessageType.USER_IMAGE,
      imageData: imageBase64,
      timestamp: Date.now()
    };
    
    // Add Card to History
    const aiCardId = uuidv4();
    const newAiCard: Message = {
      id: aiCardId,
      type: MessageType.AI_CARD,
      data: data,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg, newAiCard]);
    setPreviewItem(null);
  };

  // Cancel/Dismiss Preview
  const cancelPreview = () => {
    setPreviewItem(null);
  };

  // Handle Text/Voice Chat
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    initAudio();
    const text = inputValue;
    setInputValue('');

    const userMsg: Message = {
      id: uuidv4(),
      type: MessageType.USER_TEXT,
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setAppState(AppState.ANALYZING);

    try {
      // Generate AI Response
      // Convert history to strings for context
      const history = messages
        .filter(m => m.content)
        .map(m => `${m.type === MessageType.USER_TEXT ? 'User' : 'AI'}: ${m.content}`);

      const responseText = await getChatResponse(history, text);

      const aiMsg: Message = {
        id: uuidv4(),
        type: MessageType.AI_TEXT,
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);

      // Speak result
      await speakText(responseText);

    } catch (error: any) {
       console.error(error);
       if (error.message === 'API_KEY_MISSING') {
          setShowKeyModal(true);
       }
    } finally {
      setAppState(AppState.IDLE);
    }
  };

  // Speech Recognition Setup
  const toggleListening = () => {
    initAudio();
    
    if (appState === AppState.LISTENING) {
      recognitionRef.current?.stop();
      setAppState(AppState.IDLE);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setAppState(AppState.LISTENING);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setTimeout(() => {
          setInputValue(transcript); 
      }, 0);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setAppState(AppState.IDLE);
    };

    recognition.onend = () => {
      // Use functional update to ensure we check the current state value
      // and avoid using stale closure variable 'appState' which TS narrowed.
      setAppState((current) => {
        if (current === AppState.LISTENING) {
           return AppState.IDLE;
        }
        return current;
      });
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Trigger send when voice fills input
  useEffect(() => {
    if (appState === AppState.IDLE && inputValue.length > 0 && recognitionRef.current) {
        handleSendMessage(); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;
    const threshold = 50; // min swipe distance

    // Swipe Up: Expand Chat (if not already full)
    if (diffY > threshold && !isChatFullscreen) {
        setIsChatFullscreen(true);
    }
    // Swipe Down: Shrink Chat (if currently full)
    else if (diffY < -threshold && isChatFullscreen) {
        // Only collapse if we are at the top of the list or close to it, 
        // otherwise scrolling up content might trigger it. 
        // For simplicity here, we assume if the user swipes down on the header/top area it works.
        // Actually, let's just make it simple: forceful swipe down anywhere toggles it back for now,
        // or relies on the header area.
        setIsChatFullscreen(false);
    }
    touchStartY.current = null;
  };


  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden font-sans relative">
      
      {/* API Key Modal */}
      {showKeyModal && <ApiKeyModal onSave={handleSaveKey} />}

      {/* Top Half: Camera (or Image Preview) */}
      <div 
        className={`transition-all duration-500 ease-in-out relative z-10 overflow-hidden bg-black
          ${isChatFullscreen ? 'h-0 opacity-0' : 'flex-grow h-[45%] opacity-100'}
        `}
      >
        <CameraView onCapture={handleImageCapture} isActive={isCameraActive && !isChatFullscreen && !showHistory && !showKeyModal} />
        
        {/* Header Overlay */}
        <div className="absolute top-4 left-4 z-20">
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-md">NutriVision<span className="text-green-400">.AI</span></h1>
        </div>
        
        {/* History Button */}
        <div className="absolute top-4 right-4 z-20">
             <button 
                onClick={() => setShowHistory(true)}
                className="p-2.5 bg-slate-900/50 backdrop-blur-md rounded-full text-white border border-white/10 shadow-lg hover:bg-slate-900/80 transition-all active:scale-95"
                aria-label="History"
            >
                <HistoryIcon />
            </button>
        </div>
      </div>

      {/* Bottom Half: Chat & Results */}
      <div 
        className={`
          flex-1 bg-slate-950 rounded-t-3xl z-20 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.5)] overflow-hidden relative transition-all duration-500 ease-in-out
          ${isChatFullscreen ? 'h-full mt-0 rounded-none' : '-mt-6'}
        `}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        
        {/* Drag Handle / Header for Chat */}
        <div className="w-full flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
             <div className="w-12 h-1.5 bg-slate-700 rounded-full"></div>
        </div>

        {/* Fullscreen Header (only visible when fullscreen) */}
        {isChatFullscreen && (
            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800 animate-fade-in">
                 <h2 className="font-bold text-slate-200">Chat</h2>
                 <button 
                    onClick={() => setIsChatFullscreen(false)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full flex items-center gap-2 px-3 text-sm font-medium"
                 >
                    <CameraIcon />
                    Camera
                 </button>
            </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type.startsWith('USER') ? 'justify-end' : 'justify-start'}`}>
              
              {/* Image Message */}
              {msg.type === MessageType.USER_IMAGE && msg.imageData && (
                 <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-700">
                    <img src={`data:image/jpeg;base64,${msg.imageData}`} alt="User capture" className="w-full h-full object-cover" />
                 </div>
              )}

              {/* Text Message with Save Button for AI */}
              {(msg.type === MessageType.USER_TEXT || msg.type === MessageType.AI_TEXT) && (
                <div className="flex flex-col gap-1 items-start max-w-[85%]">
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.type === MessageType.USER_TEXT 
                        ? 'bg-blue-600 text-white rounded-br-none self-end' 
                        : 'bg-slate-800 text-slate-200 rounded-bl-none'
                    }`}>
                        {msg.content}
                    </div>
                    
                    {/* Save Button for AI Text */}
                    {msg.type === MessageType.AI_TEXT && (
                        <button 
                            onClick={() => toggleSaveMessage(msg.id)}
                            className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border transition-all ${
                                msg.isSaved 
                                ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                        >
                            {msg.isSaved ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                  <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                                </svg>
                            )}
                            {msg.isSaved ? 'Saved' : 'Save Recipe'}
                        </button>
                    )}
                </div>
              )}

              {/* Data Card (In History - No Save Buttons) */}
              {msg.type === MessageType.AI_CARD && msg.data && (
                <NutriCard data={msg.data} />
              )}
            </div>
          ))}
          
          {appState === AppState.ANALYZING && (
              <div className="flex justify-start">
                  <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></span>
                  </div>
              </div>
          )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button 
                onClick={toggleListening}
                className={`p-3 rounded-full transition-colors ${
                    appState === AppState.LISTENING 
                    ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
            >
                {appState === AppState.LISTENING ? <StopIcon /> : <MicIcon />}
            </button>
            
            <div className="flex-1 bg-slate-800 rounded-full px-4 py-2 flex items-center">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask for recipe or advice..."
                    className="bg-transparent border-none outline-none text-white w-full text-sm placeholder-slate-500"
                />
            </div>
            
            <button 
                onClick={handleSendMessage}
                disabled={!inputValue}
                className="p-3 bg-green-500 rounded-full text-slate-900 font-bold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <SendIcon />
            </button>
          </div>
          {/* Only show hint if not fullscreen to save space */}
          {!isChatFullscreen && (
              <div className="text-center mt-2">
                  <p className="text-[10px] text-slate-600">
                      {appState === AppState.SPEAKING ? "AI Speaking..." : "Swipe up for full chat"}
                  </p>
              </div>
          )}
        </div>
      </div>
      
      {/* Global Nutrition Preview Modal Overlay */}
      {previewItem && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-6 animate-fade-in">
           <NutriCard 
               data={previewItem.data} 
               onSave={savePreview}
               onDismiss={cancelPreview} 
           />
        </div>
      )}

      {/* History View Overlay */}
      {showHistory && (
        <HistoryView 
            messages={messages} 
            onClose={() => setShowHistory(false)} 
            onResetKey={handleResetKey}
        />
      )}
    </div>
  );
};

export default App;