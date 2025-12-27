import React, { useState } from 'react';
import { Student, Level, SubscriptionPackage, SubscriptionStatus, PACKAGE_AMOUNTS, Lesson, LessonStatus } from '../src/types';
import { Mail, Phone, Calendar, Gift, History, User, PlusCircle } from 'lucide-react';
import { addMinutes } from '../src/utils';

interface StudentModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStudent: Student) => void;
  upcomingLessons: Lesson[];
  teachers: {id: string, fullName: string, levels: Level[]}[];
}

export const StudentModal: React.FC<StudentModalProps> = ({ 
  student, isOpen, onClose, onUpdate, upcomingLessons, teachers
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'send'>('details');
  const [formData, setFormData] = useState<Student>(student);
  const [emailNote, setEmailNote] = useState('');

  if (!isOpen) return null;

  // Handler for form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('sub_')) {
        // Handle nested subscription updates
        if (!formData.currentSubscription) return;
        const subField = name.replace('sub_', '');
        
        setFormData(prev => ({
            ...prev,
            currentSubscription: {
                ...prev.currentSubscription!,
                [subField]: value
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubToggle = () => {
      if(!formData.currentSubscription) return;
      const newStatus = formData.currentSubscription.status === SubscriptionStatus.Active ? SubscriptionStatus.NonActive : SubscriptionStatus.Active;
      setFormData(prev => ({
          ...prev,
          currentSubscription: { ...prev.currentSubscription!, status: newStatus }
      }));
  };

  const handleCreateSubscription = () => {
    setFormData(prev => ({
      ...prev,
      currentSubscription: {
        id: Math.random().toString(36).substr(2, 9),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        packageType: SubscriptionPackage.Gold,
        giftLessons: 0,
        status: SubscriptionStatus.Active,
        lessonsUsed: 0,
        initialBalance: PACKAGE_AMOUNTS[SubscriptionPackage.Gold]
      }
    }));
  };

  const handleSave = () => {
    onUpdate(formData);
    onClose();
  };

  const handleSendSchedule = () => {
      // Mock email sending
      const scheduleText = upcomingLessons.map(l => 
        `${l.date} ${l.startTime} - ${teachers.find(t => t.id === l.teacherId)?.fullName || 'Unknown'} (${l.duration}m)`
      ).join('\n');
      
      console.log(`Sending email to ${student.email}:\n\nNote: ${emailNote}\n\nSchedule:\n${scheduleText}`);
      alert(`Schedule sent to ${student.email} successfully!`);
      setEmailNote('');
  };

  const currentSub = formData.currentSubscription;
  const totalLessons = currentSub ? currentSub.initialBalance + currentSub.giftLessons : 0;
  const remaining = currentSub ? totalLessons - currentSub.lessonsUsed : 0;

  // Filter teachers by student level
  const compatibleTeachers = teachers.filter(t => t.levels.includes(formData.level));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 bg-indigo-600 text-white flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    <User className="h-6 w-6" />
                    {formData.id ? 'Edit Student' : 'Add New Student'}
                </h2>
                <p className="text-indigo-200 text-sm mt-1">{formData.email || 'New student profile'} • {formData.level}</p>
            </div>
            <button onClick={onClose} className="text-indigo-100 hover:text-white hover:bg-indigo-500 p-2 rounded-full transition"><User className="h-5 w-5 rotate-45" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-8">
            <button 
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Student Details
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Subscription History
            </button>
            <button 
                onClick={() => setActiveTab('send')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'send' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                Send Lessons
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
            {activeTab === 'details' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <User size={18} /> Personal Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                                <input name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50" placeholder="e.g. Jane Doe" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                    <input name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50" placeholder="email@example.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50" placeholder="555-0000" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone 2</label>
                                    <input name="phone2" value={formData.phone2 || ''} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50" placeholder="Optional" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">ID No.</label>
                                    <input name="idNumber" value={formData.idNumber} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Student Level</label>
                                    <select name="level" value={formData.level} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50">
                                        {Object.values(Level).map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Preferred Teacher</label>
                                    <select 
                                        name="preferredTeacherId" 
                                        value={formData.preferredTeacherId || ''} 
                                        onChange={handleChange} 
                                        className="w-full p-2 border rounded-md bg-gray-50"
                                    >
                                        <option value="">-- No Preference --</option>
                                        {compatibleTeachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Subscription */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Gift size={18} /> Active Subscription
                        </h3>
                        {currentSub ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <span className="font-medium text-indigo-900">Subscription Status</span>
                                    <button 
                                        onClick={handleSubToggle}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentSub.status === SubscriptionStatus.Active ? 'bg-green-500' : 'bg-gray-300'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${currentSub.status === SubscriptionStatus.Active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sub ID</label>
                                        <input name="sub_id" value={currentSub.id} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-100 text-gray-500" readOnly />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Package</label>
                                        <select name="sub_packageType" value={currentSub.packageType} onChange={(e) => {
                                            const newPkg = e.target.value as SubscriptionPackage;
                                            setFormData(prev => ({
                                                ...prev,
                                                currentSubscription: {
                                                    ...prev.currentSubscription!,
                                                    packageType: newPkg,
                                                    initialBalance: PACKAGE_AMOUNTS[newPkg]
                                                }
                                            }))
                                        }} className="w-full p-2 border rounded-md bg-gray-50">
                                            {Object.values(SubscriptionPackage).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                                        <input type="date" name="sub_startDate" value={currentSub.startDate} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                                        <input type="date" name="sub_endDate" value={currentSub.endDate} onChange={handleChange} className="w-full p-2 border rounded-md bg-gray-50" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-2">
                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-500">Total</div>
                                        <div className="font-bold text-lg">{totalLessons}</div>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                        <div className="text-xs text-gray-500">Used</div>
                                        <div className="font-bold text-lg">{currentSub.lessonsUsed}</div>
                                    </div>
                                    <div className="text-center p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                                        <div className="text-xs text-indigo-600 font-bold">Remaining</div>
                                        <div className="font-bold text-lg text-indigo-700">{remaining}</div>
                                    </div>
                                </div>
                                
                                <div>
                                     <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Gift Lessons</label>
                                     <input 
                                        type="number" 
                                        name="sub_giftLessons" 
                                        value={currentSub.giftLessons} 
                                        onChange={handleChange} 
                                        className="w-full p-2 border rounded-md bg-gray-50"
                                     />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500 mb-4">No active subscription found.</p>
                                <button 
                                    onClick={handleCreateSubscription}
                                    className="px-4 py-2 bg-white border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium flex items-center justify-center gap-2 mx-auto"
                                >
                                    <PlusCircle size={18} />
                                    Create Subscription
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Start Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">End Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Package</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Usage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[...(formData.subscriptionHistory || []), ...(formData.currentSubscription ? [formData.currentSubscription] : [])].map((sub, i) => {
                                const total = sub.initialBalance + sub.giftLessons;
                                const rem = total - sub.lessonsUsed;
                                return (
                                <tr key={sub.id || i} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-700">{sub.startDate}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{sub.endDate}</td>
                                    <td className="px-6 py-4 text-sm"><span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{sub.packageType}</span></td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {sub.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right font-mono">
                                        {sub.lessonsUsed} / {total} <span className="text-gray-400">({rem} left)</span>
                                    </td>
                                </tr>
                            )})}
                            {(!formData.subscriptionHistory?.length && !formData.currentSubscription) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">No subscription history available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'send' && (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Send Upcoming Schedule</h3>
                    <p className="text-sm text-gray-500 mb-6">This will email <strong>{formData.email}</strong> with their scheduled lessons for the next 4 weeks.</p>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Add a personal note (optional)</label>
                        <textarea 
                            rows={4} 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50" 
                            placeholder="Hi there, here is your schedule..."
                            value={emailNote}
                            onChange={(e) => setEmailNote(e.target.value)}
                        />
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Preview of lessons to send:</h4>
                        <ul className="space-y-2">
                            {upcomingLessons.length > 0 ? upcomingLessons.map(l => (
                                <li key={l.id} className="text-sm flex justify-between">
                                    <span>{l.date} @ {l.startTime}</span>
                                    <span className="text-gray-500">{teachers.find(t => t.id === l.teacherId)?.fullName} ({l.duration}m)</span>
                                </li>
                            )) : <li className="text-sm text-gray-400 italic">No upcoming lessons scheduled.</li>}
                        </ul>
                    </div>

                    <button 
                        onClick={handleSendSchedule}
                        disabled={upcomingLessons.length === 0}
                        className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Mail size={18} /> Send Schedule
                    </button>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md transition">Save Changes</button>
        </div>
      </div>
    </div>
  );
};