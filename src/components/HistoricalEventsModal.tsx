import React, { useState } from 'react';
import { Award, Sparkles, X, ChevronRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { HistoricalEvent } from '../types/game';
import { HISTORICAL_EVENTS } from '../data/sengokuData';
import { sound } from '../utils/sound';

interface HistoricalEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyEventChoice: (choice: HistoricalEvent['choices'][0]) => void;
}

export const HistoricalEventsModal: React.FC<HistoricalEventsModalProps> = ({
  isOpen,
  onClose,
  onApplyEventChoice,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(HISTORICAL_EVENTS[0].id);
  const [completedEvents, setCompletedEvents] = useState<string[]>([]);
  const [activeLog, setActiveLog] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentEvent = HISTORICAL_EVENTS.find((e) => e.id === selectedEventId) || HISTORICAL_EVENTS[0];

  const handleSelectChoice = (choice: HistoricalEvent['choices'][0]) => {
    sound.playTaiko(1.2);
    setCompletedEvents((prev) => [...prev, currentEvent.id]);
    setActiveLog(choice.effect.log);
    onApplyEventChoice(choice);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="max-w-3xl w-full bg-stone-900 border-2 border-amber-600 rounded-3xl p-6 shadow-2xl text-stone-200 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold font-serif text-amber-200">
              戰國歷史合戰分歧簿 (Historical Divergence Events)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event List Tabs */}
        <div className="flex gap-2 overflow-x-auto py-3 border-b border-stone-800 scrollbar-none">
          {HISTORICAL_EVENTS.map((event) => {
            const isCompleted = completedEvents.includes(event.id);
            return (
              <button
                key={event.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedEventId(event.id);
                  setActiveLog(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-serif whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedEventId === event.id
                    ? 'bg-amber-600 text-stone-950 font-bold shadow'
                    : 'bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800'
                }`}
              >
                <span>{event.title.split(' ')[0]}</span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Event Body */}
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-400 font-serif font-bold">天正 / 永祿年號: {currentEvent.year} 年</span>
            </div>
            <h4 className="text-xl font-bold font-serif text-amber-100 mt-1">{currentEvent.title}</h4>
            <p className="text-xs text-stone-300 font-serif leading-relaxed mt-2 bg-stone-950/70 p-3 rounded-xl border border-stone-800">
              {currentEvent.summary}
            </p>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 text-xs font-serif text-stone-400">
            <span className="text-amber-400 font-bold">史實典故：</span>
            <span>{currentEvent.historicalOutcome}</span>
          </div>

          {/* Outcome Log */}
          {activeLog && (
            <div className="bg-emerald-950/30 border border-emerald-700/60 rounded-xl p-3 text-xs font-serif text-emerald-200 animate-fadeIn">
              <strong className="block text-emerald-400 mb-0.5">【分歧歷史決策結果】：</strong>
              {activeLog}
            </div>
          )}

          {/* Branching Choices */}
          <div className="space-y-3 pt-2">
            <span className="text-xs text-amber-400 font-serif font-bold block">
              請主公下達戰略抉擇 (Choose Divergence):
            </span>
            {currentEvent.choices.map((choice, idx) => (
              <div
                key={idx}
                className="bg-stone-950/80 hover:bg-stone-950 border border-stone-800 hover:border-amber-600/80 rounded-2xl p-4 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex-1">
                  <h5 className="font-serif font-bold text-sm text-amber-200 group-hover:text-amber-300">
                    {choice.text}
                  </h5>
                  <p className="text-xs text-stone-400 font-serif mt-1">{choice.description}</p>
                </div>
                <button
                  onClick={() => handleSelectChoice(choice)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-xs tracking-wider transition whitespace-nowrap shadow flex items-center gap-1 shrink-0"
                >
                  <span>決斷執行</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-serif text-xs transition"
          >
            關閉事件簿
          </button>
        </div>
      </div>
    </div>
  );
};
