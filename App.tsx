import React, { useState, useCallback } from 'react';
import { GeneratorForm } from './components/GeneratorForm';
import { CurriculumView } from './components/CurriculumView';
import { AppState, CurriculumSeries, GeneratorParams } from './types';
import { generateCurriculum } from './services/geminiService';
import { Icons } from './components/Icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [curriculum, setCurriculum] = useState<CurriculumSeries | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (params: GeneratorParams) => {
    setAppState(AppState.GENERATING);
    setError(null);
    try {
      const data = await generateCurriculum(params);
      setCurriculum(data);
      setAppState(AppState.VIEWING);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while crafting your series. Please check your connection and try again.");
      setAppState(AppState.ERROR);
    }
  }, []);

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setCurriculum(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      {/* App Shell */}
      {appState !== AppState.VIEWING && (
        <div className="flex flex-col min-h-screen">
          {/* Nav */}
          <nav className="w-full py-6 px-8 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight font-serif">
              <Icons.Layers className="w-8 h-8 text-black" />
              <span>PARABLE</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
              <a href="#" className="hover:text-black transition-colors">Library</a>
              <a href="#" className="hover:text-black transition-colors">Resources</a>
              <a href="#" className="hover:text-black transition-colors">About</a>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-grow flex flex-col items-center justify-center px-4 pb-20">
            <div className="w-full max-w-4xl mx-auto">
              
              {/* Hero Section (Only in IDLE/ERROR/GENERATING) */}
              <div className="text-center mb-12 space-y-6 animate-in fade-in duration-700">
                <h1 className="text-5xl md:text-7xl font-serif text-charcoal leading-[0.9] tracking-tight">
                  Tell the story <br />
                  <span className="text-gray-400 italic">that changes everything.</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-xl mx-auto">
                  Create thoughtful, biblically rich curriculum series for your youth ministry in seconds.
                </p>
              </div>

              {/* Error Display */}
              {appState === AppState.ERROR && (
                 <div className="max-w-xl mx-auto mb-8 bg-red-50 border border-red-200 p-4 rounded flex items-start gap-3">
                    <div className="text-red-500 mt-0.5">⚠️</div>
                    <div>
                      <h3 className="font-bold text-red-800 text-sm">Generation Failed</h3>
                      <p className="text-red-600 text-sm">{error}</p>
                      <button 
                        onClick={() => setAppState(AppState.IDLE)}
                        className="text-xs font-bold text-red-800 underline mt-2"
                      >
                        Try Again
                      </button>
                    </div>
                 </div>
              )}

              {/* Form Area */}
              <div className="bg-white md:rounded-lg p-1 md:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] border border-gray-100">
                 <div className="bg-cream/30 border border-dashed border-gray-300 md:rounded p-6 md:p-10">
                   <GeneratorForm 
                      onSubmit={handleGenerate} 
                      isLoading={appState === AppState.GENERATING} 
                   />
                 </div>
              </div>
              
            </div>
          </main>

          {/* Footer */}
          <footer className="py-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Parable App. All rights reserved.</p>
          </footer>
        </div>
      )}

      {/* Viewing State */}
      {appState === AppState.VIEWING && curriculum && (
        <CurriculumView 
          data={curriculum} 
          onReset={resetApp} 
        />
      )}
    </div>
  );
};

export default App;