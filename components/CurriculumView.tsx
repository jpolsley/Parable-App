
import React from 'react';
import { CurriculumSeries, WeekContent } from '../types';
import { Icons } from './Icons';

interface CurriculumViewProps {
  data: CurriculumSeries;
  onReset: () => void;
}

// A component specifically for the print/view layout of a single week
const WeeklyLayout: React.FC<{ week: WeekContent; index: number }> = ({ week, index }) => {
  return (
    <article className="min-h-screen bg-white relative print:block break-after-page pb-20 print:pb-0">
      {/* Decorative top bar for screen only */}
      <div className="h-2 w-full bg-charcoal mb-12 print:hidden"></div>

      {/* Page Header */}
      <header className="mb-12 border-b-4 border-black pb-6">
        <div className="flex justify-between items-end">
          <div>
             <span className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2">
               Week {index + 1}
             </span>
             <h2 className="text-5xl md:text-6xl font-serif font-bold text-charcoal leading-none">
               {week.title}
             </h2>
          </div>
          <div className="text-right hidden md:block print:block">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Scripture</div>
            <div className="font-serif text-xl italic">{week.scripture_reference}</div>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Sidebar (Metadata & Quick Hits) */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Key Verse Box */}
          <div className="bg-cream p-6 border-l-4 border-brand-blue print:border-gray-800 print:bg-gray-50">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              <Icons.Book className="w-4 h-4" /> Key Verse
            </h3>
            <blockquote className="font-serif text-lg leading-relaxed text-charcoal italic">
              "{week.key_verse}"
            </blockquote>
          </div>

          {/* Leader Essentials */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal border-b border-gray-200 pb-2 mb-3">
                The Big Idea
              </h3>
              <p className="text-sm leading-relaxed text-gray-700">
                {week.main_idea}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal border-b border-gray-200 pb-2 mb-3">
                Learning Objective
              </h3>
              <p className="text-sm leading-relaxed text-gray-700">
                {week.learning_objective}
              </p>
            </div>
          </div>

          {/* Activity & Challenge (Visual Break) */}
           <div className="bg-charcoal text-white p-6 print:text-black print:bg-transparent print:border print:border-black">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 print:text-black">
              <Icons.Sparkles className="w-4 h-4" /> Engagement
            </h3>
            
            <div className="mb-6">
              <h4 className="font-bold text-sm mb-1 text-brand-orange print:text-black">Activity Idea</h4>
              <p className="text-xs leading-relaxed text-gray-300 print:text-gray-700">
                {week.activity_idea}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm mb-1 text-brand-blue print:text-black">Weekly Challenge</h4>
              <p className="text-xs leading-relaxed text-gray-300 print:text-gray-700">
                {week.application_challenge}
              </p>
            </div>
          </div>

        </aside>

        {/* Right Content (Teaching & Questions) */}
        <main className="lg:col-span-8">
          
          {/* Hook Section */}
          <section className="mb-12">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
              <Icons.Anchor className="w-4 h-4" /> The Hook
            </h3>
            <div className="prose prose-lg text-gray-800 leading-loose font-serif">
              {week.hook}
            </div>
          </section>

          {/* Teaching Points */}
          <section className="mb-12">
             <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
              <Icons.Layers className="w-4 h-4" /> Teaching Guide
            </h3>
            
            <div className="space-y-10">
              {week.teaching_points.map((tp, i) => (
                <div key={i} className="relative pl-8 border-l-2 border-gray-200">
                  <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></span>
                  <h4 className="text-xl font-bold text-charcoal mb-3">
                    {tp.point}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {tp.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Discussion Questions */}
          <section className="bg-gray-50 p-8 rounded-sm print:bg-transparent print:p-0 print:border-t print:border-gray-200 print:pt-8">
             <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">
              <Icons.Users className="w-4 h-4" /> Discussion
            </h3>
            <ol className="space-y-4 list-decimal list-inside marker:font-bold marker:text-gray-400">
              {week.discussion_questions.map((q, idx) => (
                <li key={idx} className="text-gray-800 pl-2">
                  <span className="text-gray-700">{q}</span>
                </li>
              ))}
            </ol>
          </section>

        </main>
      </div>
      
      {/* Footer for Page */}
      <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-mono print:flex">
        <span>PARABLE CURRICULUM</span>
        <span>PAGE {index + 2}</span>
      </div>
    </article>
  );
};

export const CurriculumView: React.FC<CurriculumViewProps> = ({ data, onReset }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white min-h-screen font-sans text-charcoal">
      
      {/* Floating Action Bar (Screen Only) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-charcoal text-white px-2 py-2 rounded-full shadow-2xl print:hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
         <button 
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded-full transition-colors text-sm font-medium"
          >
            <Icons.Back className="w-4 h-4" />
            <span>New</span>
          </button>
          <div className="w-px h-4 bg-gray-600"></div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-full hover:bg-gray-100 transition-colors text-sm font-bold"
          >
            <Icons.Print className="w-4 h-4" />
            <span>Print PDF</span>
          </button>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12 print:px-0 print:py-0 print:w-full print:max-w-none">
        
        {/* SERIES COVER PAGE */}
        <div className="min-h-[90vh] flex flex-col justify-center items-center text-center break-after-page print:min-h-screen">
           <div className="mb-8">
              <span className="inline-block px-3 py-1 border border-black rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                {data.target_audience} Series
              </span>
              <h1 className="text-7xl md:text-9xl font-serif font-bold text-charcoal leading-[0.85] tracking-tighter mb-8">
                {data.title}
              </h1>
              <div className="w-24 h-1 bg-black mx-auto mb-8"></div>
           </div>
           
           <p className="text-2xl md:text-3xl font-serif italic text-gray-600 max-w-2xl mx-auto leading-relaxed mb-12">
             {data.description}
           </p>

           <div className="grid grid-cols-2 gap-8 text-left max-w-md mx-auto border-t border-gray-200 pt-8 print:border-gray-800">
              <div>
                <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Duration</span>
                <span className="font-serif text-xl block">{data.weeks.length} Weeks</span>
              </div>
              <div>
                 <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Date Generated</span>
                 <span className="font-serif text-xl block">{new Date().toLocaleDateString()}</span>
              </div>
           </div>
           
           <div className="mt-24 text-xs font-mono text-gray-300 uppercase tracking-widest print:text-gray-500">
             Generated with Parable
           </div>
        </div>

        {/* INDIVIDUAL WEEKS */}
        <div className="space-y-24 print:space-y-0">
          {data.weeks.map((week, index) => (
            <WeeklyLayout key={week.week_number} week={week} index={index} />
          ))}
        </div>

      </div>
    </div>
  );
};
