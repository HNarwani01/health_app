
import React from 'react';
import { ScheduleItem } from '../types';

interface CalendarProps {
  schedule: ScheduleItem[];
  totalDays?: number;
  onSelectDay: (day: number) => void;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ schedule, totalDays = 7, onSelectDay, className = "" }) => {
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const getTasksForDay = (day: number) => schedule.filter(s => s.day === day);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'shop': return 'bg-emerald-400';
      case 'prep': return 'bg-blue-400';
      case 'cook': return 'bg-orange-400';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className={`grid grid-cols-7 gap-2 ${className}`}>
      {days.map(day => {
        const tasks = getTasksForDay(day);
        const hasTasks = tasks.length > 0;
        
        return (
          <button
            key={day}
            onClick={() => onSelectDay(day)}
            className={`
              relative flex flex-col items-center justify-start py-3 px-1 rounded-xl border h-28 transition-all duration-200 group
              ${hasTasks ? 'bg-white border-slate-200 shadow-sm hover:border-[#4c63d9] hover:shadow-md' : 'bg-slate-50/50 border-transparent hover:bg-slate-100'}
            `}
          >
            <span className={`text-xs font-bold mb-3 ${hasTasks ? 'text-slate-700' : 'text-slate-400'}`}>
              Day {day}
            </span>
            
            <div className="flex flex-col gap-1.5 w-full px-2">
              {tasks.slice(0, 4).map((t, i) => (
                <div 
                  key={t.id + i} 
                  title={`${t.type.toUpperCase()}: ${t.description}`}
                  className={`h-1.5 w-full rounded-full ${getTypeColor(t.type)} opacity-80`} 
                />
              ))}
              {tasks.length > 4 && (
                <div className="h-1.5 w-1.5 bg-slate-300 rounded-full self-center mt-1" />
              )}
            </div>

            {hasTasks && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4c63d9] opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        );
      })}
    </div>
  );
};
