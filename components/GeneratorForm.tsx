import React, { useState } from 'react';
import { GeneratorParams } from '../types';
import { Button } from './Button';
import { Icons } from './Icons';

interface GeneratorFormProps {
  onSubmit: (params: GeneratorParams) => void;
  isLoading: boolean;
}

const PRESET_TOPICS = [
  "The Parables of Jesus",
  "Identity in Christ",
  "The Book of James",
  "Friendship & Dating",
  "Prayer & Spiritual Habits"
];

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onSubmit, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('High School');
  const [duration, setDuration] = useState(4);
  const [tone, setTone] = useState('Conversational & Deep');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ topic, audience, duration, tone });
  };

  const handlePresetClick = (t: string) => {
    setTopic(t);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Topic Section */}
        <div className="space-y-4">
          <label className="block text-2xl font-serif text-charcoal">
            What would you like to teach?
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The Sermon on the Mount..."
              className="w-full bg-white border-2 border-gray-200 p-5 text-lg focus:border-black focus:outline-none transition-colors rounded-none shadow-sm placeholder:text-gray-300"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Icons.Book className="w-6 h-6" />
            </div>
          </div>
          
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESET_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handlePresetClick(t)}
                className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all rounded-full text-gray-600"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Audience Section */}
          <div className="space-y-3">
            <label className="block text-lg font-bold text-gray-700 uppercase tracking-wider text-xs">
              Audience
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Middle School', 'High School', 'Young Adult', 'Mixed'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAudience(opt)}
                  className={`px-4 py-3 text-sm font-medium border-2 transition-all ${
                    audience === opt 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Section */}
          <div className="space-y-3">
             <label className="block text-lg font-bold text-gray-700 uppercase tracking-wider text-xs">
              Series Length
            </label>
            <div className="flex items-center space-x-4 bg-white border-2 border-gray-200 p-2">
              <button
                type="button"
                onClick={() => setDuration(Math.max(1, duration - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded text-xl font-bold"
              >
                -
              </button>
              <div className="flex-1 text-center font-bold text-lg">
                {duration} Weeks
              </div>
              <button
                type="button"
                onClick={() => setDuration(Math.min(12, duration + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        {/* Submit */}
        <div className="pt-4">
          <Button 
            type="submit" 
            isLoading={isLoading}
            className="w-full text-lg py-4"
          >
            Create Series Outline
          </Button>
          <p className="text-center text-xs text-gray-400 mt-4">
            Powered by Gemini • Generates outlines, questions & activities
          </p>
        </div>

      </form>
    </div>
  );
};