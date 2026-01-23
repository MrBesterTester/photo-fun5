import React from 'react';

interface HeaderProps {
  onChangeKey?: () => void;
  apiKeyVerified?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onChangeKey, apiKeyVerified = false }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-white/10 sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white leading-none">Photo Fun</h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">AI Editor</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '—'} ·{' '}
            <a
              href="https://github.com/MrBesterTester/photo-fun5"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors"
            >
              GitHub repo
            </a>
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {onChangeKey && (
          <button 
            onClick={onChangeKey}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            Change Key
          </button>
        )}
        {apiKeyVerified ? (
          <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-tight">Ready</span>
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Not Ready</span>
          </div>
        )}
      </div>
    </header>
  );
};