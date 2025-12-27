import React, { useState } from 'react';
import { Teacher, Level, WorkingHour, DAYS_OF_WEEK } from '../src/types';
import { User, Clock, Trash2, Plus } from 'lucide-react';

interface TeacherModalProps {
  teacher: Teacher;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTeacher: Teacher) => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({ teacher, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<Teacher>(teacher);

  if (!isOpen) return null;

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleLevel = (level: Level) => {
    setFormData(prev => {
      const levels = prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level];
      return { ...prev, levels };
    });
  };

  const addWorkingHour = () => {
    setFormData(prev => ({
      ...prev,
      workingHours: [...prev.workingHours, { dayOfWeek: 'Monday', startHour: '09:00', endHour: '17:00' }]
    }));
  };

  const updateWorkingHour = (index: number, field: keyof WorkingHour, value: string) => {
    const newHours = [...formData.workingHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setFormData(prev => ({ ...prev, workingHours: newHours }));
  };

  const removeWorkingHour = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workingHours: prev.workingHours.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    // Validate 5 hour rule
    const invalidHours = formData.workingHours.some(wh => {
        const start = parseInt(wh.startHour.replace(':', ''));
        const end = parseInt(wh.endHour.replace(':', ''));
        // 5 hours = 500 in HHMM integer math roughly, but let's do hours
        const sH = parseInt(wh.startHour.split(':')[0]);
        const eH = parseInt(wh.endHour.split(':')[0]);
        return (eH - sH) < 5;
    });

    if (invalidHours) {
        alert("Working blocks must be at least 5 hours long.");
        return;
    }

    onUpdate(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-teal-600 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <User className="h-5 w-5" /> 
                {formData.id ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>
            <button onClick={onClose} className="hover:bg-teal-500 p-1 rounded-full"><User className="h-4 w-4 rotate-45" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                        <input name="fullName" value={formData.fullName} onChange={handleInfoChange} className="w-full p-2 border rounded bg-gray-50" placeholder="Full Name" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                        <input name="email" value={formData.email} onChange={handleInfoChange} className="w-full p-2 border rounded bg-gray-50" placeholder="Email" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                        <input name="phone" value={formData.phone} onChange={handleInfoChange} className="w-full p-2 border rounded bg-gray-50" placeholder="Phone" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-gray-800 border-b pb-2">Teaching Levels</h3>
                <div className="flex flex-wrap gap-2">
                    {Object.values(Level).map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => toggleLevel(lvl)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${formData.levels.includes(lvl) ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-800">Working Hours</h3>
                    <button onClick={addWorkingHour} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded hover:bg-teal-100 flex items-center gap-1">
                        <Plus size={12} /> Add Block
                    </button>
                </div>
                
                <div className="space-y-2">
                    {formData.workingHours.map((wh, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <select 
                                value={wh.dayOfWeek}
                                onChange={(e) => updateWorkingHour(idx, 'dayOfWeek', e.target.value)}
                                className="p-1 text-sm border rounded bg-gray-50"
                            >
                                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <span className="text-gray-400">from</span>
                            <select 
                                value={wh.startHour}
                                onChange={(e) => updateWorkingHour(idx, 'startHour', e.target.value)}
                                className="p-1 text-sm border rounded bg-gray-50"
                            >
                                {Array.from({length: 28}, (_, i) => {
                                    const h = 7 + Math.floor(i/2);
                                    const m = i % 2 === 0 ? '00' : '30';
                                    const t = `${h.toString().padStart(2,'0')}:${m}`;
                                    return <option key={t} value={t}>{t}</option>
                                })}
                            </select>
                            <span className="text-gray-400">to</span>
                            <select 
                                value={wh.endHour}
                                onChange={(e) => updateWorkingHour(idx, 'endHour', e.target.value)}
                                className="p-1 text-sm border rounded bg-gray-50"
                            >
                                {Array.from({length: 29}, (_, i) => {
                                    const h = 7 + Math.floor(i/2);
                                    const m = i % 2 === 0 ? '00' : '30';
                                    const t = `${h.toString().padStart(2,'0')}:${m}`;
                                    return <option key={t} value={t}>{t}</option>
                                })}
                            </select>
                            <button onClick={() => removeWorkingHour(idx)} className="ml-auto text-red-400 hover:text-red-600">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {formData.workingHours.length === 0 && <p className="text-sm text-gray-400 italic">No working hours defined.</p>}
                </div>
                <p className="text-xs text-orange-600 mt-2">* Shifts must be at least 5 hours long.</p>
            </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 shadow-sm">Save Profile</button>
        </div>
      </div>
    </div>
  );
};
