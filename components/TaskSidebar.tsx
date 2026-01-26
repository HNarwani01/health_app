
import React, { useState } from 'react';
import { ScheduleItem } from '../types';
import { Heading, Button, Text } from './ui/Layout';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  day: number | null;
  tasks: ScheduleItem[];
  onReschedule: (id: string, newDay: number, newTime: string) => void;
}

export const TaskSidebar: React.FC<SidebarProps> = ({ isOpen, onClose, day, tasks, onReschedule }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ day: 1, time: '' });

  if (!isOpen) return null;

  const startEdit = (task: ScheduleItem) => {
    setEditingId(task.id);
    setEditForm({ day: task.day, time: task.timeBlock.includes('@') ? task.timeBlock.split('@')[1].trim() : task.timeBlock });
  };

  const handleSave = (id: string) => {
    // Reconstruct simple timeBlock format or use raw input
    const timeBlock = editForm.time.includes(':') && !editForm.time.includes('@') 
      ? `Day ${editForm.day} @ ${editForm.time}` 
      : editForm.time;
      
    onReschedule(id, editForm.day, timeBlock);
    setEditingId(null);
  };

  const getTypeStyle = (type: string) => {
     switch(type) {
       case 'shop': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
       case 'prep': return 'bg-blue-100 text-blue-700 border-blue-200';
       case 'cook': return 'bg-orange-100 text-orange-700 border-orange-200';
       default: return 'bg-slate-100 text-slate-700';
     }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
             <Text variant="muted" className="uppercase tracking-widest">Schedule</Text>
             <Heading level={2}>Day {day}</Heading>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 text-xl">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6">
          {tasks.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <div className="text-4xl mb-2">☕</div>
              <p>Nothing scheduled for Day {day}</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative group">
                {/* Visual Type Indicator */}
                <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded uppercase border ${getTypeStyle(task.type)}`}>
                  {task.type}
                </div>

                {editingId === task.id ? (
                  <div className="space-y-4 animate-in fade-in">
                    <Heading level={3} className="text-slate-800">Reschedule Task</Heading>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Move to Day</label>
                      <select 
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                        value={editForm.day}
                        onChange={e => setEditForm({...editForm, day: Number(e.target.value)})}
                      >
                        {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>Day {d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">New Time</label>
                      <input 
                        type="text"
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                        value={editForm.time}
                        onChange={e => setEditForm({...editForm, time: e.target.value})}
                        placeholder="e.g. 18:00 or Morning"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="secondary" className="!py-1.5 !px-3 !text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button className="!py-1.5 !px-3 !text-xs" onClick={() => handleSave(task.id)}>Save Changes</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="pr-16 mb-2">
                       <h3 className="font-bold text-slate-800">{task.description}</h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mb-4">
                      <span className="flex items-center gap-1">
                        🕒 {task.timeBlock}
                      </span>
                      <span className="flex items-center gap-1">
                        ⏳ {task.durationMinutes}m
                      </span>
                    </div>

                    <Button 
                      variant="secondary" 
                      className="w-full !py-2 !text-xs !border-slate-100 !bg-slate-50 hover:!bg-slate-100 hover:!border-slate-200 text-slate-500"
                      onClick={() => startEdit(task)}
                    >
                      Reschedule
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
