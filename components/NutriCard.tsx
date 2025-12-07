import React from 'react';
import { NutritionalData } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface NutriCardProps {
  data: NutritionalData;
  onDismiss?: () => void;
  onSave?: () => void;
}

const NutriCard: React.FC<NutriCardProps> = ({ data, onDismiss, onSave }) => {
  const chartData = [
    { name: 'Carbs', value: data.carbs, color: '#fbbf24' }, // Amber
    { name: 'Protein', value: data.protein, color: '#3b82f6' }, // Blue
  ];

  // GI Color Logic
  const getGiColor = (gi: number) => {
    if (gi < 55) return 'text-green-400';
    if (gi < 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-slate-800 rounded-2xl p-5 shadow-2xl border border-slate-700 w-full max-w-sm mx-auto my-2 animate-fade-in-up relative ${onDismiss ? 'scale-105 ring-2 ring-slate-600' : ''}`}>
      {/* Show X only if we don't have explicit bottom buttons (i.e. not in save mode) */}
      {!onSave && onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute -top-3 -right-3 bg-slate-700 text-white p-2 rounded-full shadow-lg border border-slate-600 hover:bg-red-500 hover:border-red-500 transition-colors z-50"
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <h3 className="text-xl font-bold text-white mb-1 capitalize pr-8">{data.foodName}</h3>
      <p className="text-slate-400 text-sm italic mb-4">{data.summary}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900/50 p-3 rounded-xl flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{data.calories}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wide">Calories</span>
        </div>
        
        <div className="bg-slate-900/50 p-3 rounded-xl flex flex-col justify-center space-y-2">
            <div className="flex justify-between items-center w-full">
                <span className="text-xs text-slate-400">GI</span>
                <span className={`font-bold ${getGiColor(data.gi)}`}>{data.gi}</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${getGiColor(data.gi).replace('text-', 'bg-')}`} style={{ width: `${Math.min(data.gi, 100)}%` }}></div>
            </div>
             <div className="flex justify-between items-center w-full">
                <span className="text-xs text-slate-400">GL</span>
                <span className="font-bold text-white">{data.gl}</span>
            </div>
        </div>
      </div>

      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={50} tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                cursor={{fill: 'transparent'}}
            />
            <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-around text-xs text-slate-500 mt-[-10px]">
          <span>Carbs (g)</span>
          <span>Protein (g)</span>
      </div>

      {/* Action Buttons for Preview Mode */}
      {onSave && onDismiss && (
        <div className="flex gap-3 mt-5 pt-4 border-t border-slate-700/50">
            <button 
                onClick={onDismiss}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-semibold transition-colors text-sm"
            >
                Cancel
            </button>
            <button 
                onClick={onSave}
                className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-400 text-slate-900 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Save to History
            </button>
        </div>
      )}
    </div>
  );
};

export default NutriCard;