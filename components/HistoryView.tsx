import React from 'react';
import { Message, MessageType } from '../types';

interface HistoryViewProps {
  messages: Message[];
  onClose: () => void;
  onResetKey?: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ messages, onClose, onResetKey }) => {
  // 1. Parse History: Combine Images+Data OR find Saved Text
  const historyItems = messages.reduce((acc, msg, index) => {
    // Case A: Food Data Card
    if (msg.type === MessageType.AI_CARD && msg.data) {
        // Look backwards for the nearest image
        let imageData = null;
        for (let i = index - 1; i >= 0; i--) {
            if (messages[i].type === MessageType.USER_IMAGE) {
                imageData = messages[i].imageData;
                break; 
            }
             if (messages[i].type === MessageType.AI_CARD) break; 
        }
        acc.push({
            type: 'FOOD',
            id: msg.id,
            data: msg.data,
            timestamp: msg.timestamp,
            image: imageData
        });
    }
    // Case B: Saved Text (Recipes)
    else if (msg.type === MessageType.AI_TEXT && msg.isSaved) {
        acc.push({
            type: 'RECIPE',
            id: msg.id,
            content: msg.content,
            timestamp: msg.timestamp
        });
    }
    return acc;
  }, [] as any[]).reverse();

  // Export Function
  const handleExport = () => {
    const exportData = historyItems.map(item => ({
        type: item.type,
        date: new Date(item.timestamp).toISOString(),
        details: item.type === 'FOOD' ? item.data : { text: item.content }
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrivision_history_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Share Function
  const handleShare = (item: any, platform: 'whatsapp' | 'sms') => {
    let text = "";
    if (item.type === 'FOOD') {
        text = `Check out this food I scanned with NutriVision: ${item.data.foodName} - ${item.data.calories}kcal (P:${item.data.protein}g C:${item.data.carbs}g)`;
    } else {
        text = `Here is a recipe I found on NutriVision:\n\n${item.content?.substring(0, 200)}...`;
    }

    const encodedText = encodeURIComponent(text);
    if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    } else {
        window.open(`sms:?body=${encodedText}`, '_blank');
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col animate-fade-in text-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 backdrop-blur-md sticky top-0 z-10">
        <h2 className="text-xl font-bold tracking-tight">History</h2>
        <div className="flex gap-2">
             {/* Key Reset Button */}
             {onResetKey && (
                <button 
                    onClick={onResetKey}
                    className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-yellow-400 hover:bg-slate-700 transition-colors"
                    title="Change API Key"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                   </svg>
                </button>
            )}

            <button 
                onClick={handleExport}
                className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-green-400 hover:bg-slate-700 transition-colors"
                title="Export JSON"
            >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
               </svg>
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {historyItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-2">
                <p>No history yet.</p>
             </div>
        ) : (
            historyItems.map((item) => (
            <div key={item.id} className="bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-700/50">
                
                {/* Content Body */}
                <div className="p-3 flex gap-4">
                    {/* Thumbnail / Icon */}
                    <div className="w-20 h-20 rounded-xl bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-600 flex items-center justify-center">
                        {item.type === 'FOOD' ? (
                            item.image ? (
                                <img src={`data:image/jpeg;base64,${item.image}`} alt={item.data.foodName} className="w-full h-full object-cover" />
                            ) : <span className="text-xs text-slate-500">No Img</span>
                        ) : (
                             // Recipe Icon
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-yellow-500">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                             </svg>
                        )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                             <h3 className="font-bold text-white truncate text-lg capitalize">
                                 {item.type === 'FOOD' ? item.data.foodName : "Saved Recipe"}
                             </h3>
                             <span className="text-xs text-slate-500 whitespace-nowrap ml-2 font-mono">
                                 {formatTime(item.timestamp)}
                             </span>
                        </div>
                        
                        {item.type === 'FOOD' ? (
                            <>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-xl font-black text-white">{item.data.calories}</span>
                                    <span className="text-xs text-slate-400 uppercase font-bold mt-1">kcal</span>
                                </div>
                                <div className="flex gap-2 text-xs font-medium">
                                    <span className="text-blue-400">P: {item.data.protein}g</span>
                                    <span className="text-amber-400">C: {item.data.carbs}g</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {item.content}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-900/50 px-3 py-2 flex justify-end gap-3 border-t border-slate-700/50">
                    <button onClick={() => handleShare(item, 'whatsapp')} className="text-xs font-medium text-green-400 hover:text-green-300 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                    </button>
                    <div className="w-px bg-slate-700 h-4 self-center"></div>
                    <button onClick={() => handleShare(item, 'sms')} className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                          <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                        </svg>
                        SMS
                    </button>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default HistoryView;