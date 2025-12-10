import React, { useState } from 'react';
import TermsModal from './TermsModal';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [key, setKey] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim().length > 10) {
      onSave(key.trim());
    }
  };

  return (
    <>
      <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center gap-3 mb-4 text-green-400">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
               <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
             </svg>
             <h2 className="text-xl font-bold text-white">Setup API Key</h2>
          </div>
          
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            To use NutriVision, you need a Google Gemini API Key. It's free to get started. 
            Your key is stored locally on your device.
          </p>
  
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Paste your API Key here..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-green-500 transition-colors"
                autoFocus
              />
            </div>
  
            <button
              type="submit"
              disabled={key.length < 10}
              className="w-full bg-green-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Save Key & Start
            </button>
          </form>

          {/* Terms Agreement & Link */}
          <div className="mt-4 text-center">
             <p className="text-[10px] text-slate-500">
               By using this app, you agree to comply with the 
               <button 
                 type="button" 
                 onClick={() => setShowTerms(true)}
                 className="text-blue-400 hover:text-blue-300 ml-1 underline decoration-dotted"
               >
                 Terms of Use
               </button>.
             </p>
          </div>
  
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
              <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-400 text-xs hover:text-blue-300 underline"
              >
                  Get a free API Key from Google AI Studio
              </a>
          </div>
        </div>
      </div>
      
      {/* Terms Modal Overlay */}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </>
  );
};

export default ApiKeyModal;