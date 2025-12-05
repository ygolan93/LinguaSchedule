import React, { useState, useMemo, useEffect } from 'react';
import { Teacher, Student, Lesson, SubscriptionStatus, LessonStatus } from '../types';
import { checkStudentAvailability, getAvailableTeachersForSlot, getAvailableStudentsForSlot } from '../utils';
import { X, AlertCircle, Check, User, Clock } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  lessons: Lesson[];
  onConfirm: (lesson: Omit<Lesson, 'id'>) => void;
  initialDate?: string;
  initialTime?: string;
  fixedStudentId?: string;
  fixedTeacherId?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen, onClose, students, teachers, lessons, onConfirm,
  initialDate, initialTime, fixedStudentId, fixedTeacherId
}) => {
  // If we have fixed props, we are in "Slot Mode"
  const isSlotMode = !!(initialDate && initialTime);

  const [selectedStudentId, setSelectedStudentId] = useState(fixedStudentId || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState(fixedTeacherId || '');
  const [date, setDate] = useState(initialDate || '');
  const [duration, setDuration] = useState<20 | 40>(20);
  const [selectedTime, setSelectedTime] = useState(initialTime || '');

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedStudentId(fixedStudentId || '');
      // If student mode, pre-select preferred teacher if available
      if (fixedStudentId) {
        const student = students.find(s => s.id === fixedStudentId);
        if (student?.preferredTeacherId) {
            setSelectedTeacherId(student.preferredTeacherId);
        } else {
            setSelectedTeacherId('');
        }
      } else {
        setSelectedTeacherId(fixedTeacherId || '');
      }
      
      setDate(initialDate || '');
      setSelectedTime(initialTime || '');
      setDuration(20);
    }
  }, [isOpen, fixedStudentId, fixedTeacherId, initialDate, initialTime, students]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  // -- LOGIC --

  // 1. Get available options based on what is missing
  const availableTeachers = useMemo(() => {
    if (!isOpen) return []; // Optimization
    if (!isSlotMode) return []; 
    if (fixedTeacherId) return []; // Already fixed
    return getAvailableTeachersForSlot(
      date, 
      selectedTime, 
      duration, 
      teachers, 
      lessons, 
      selectedStudent?.level
    );
  }, [isOpen, isSlotMode, fixedTeacherId, date, selectedTime, duration, teachers, lessons, selectedStudent]);

  const availableStudents = useMemo(() => {
    if (!isOpen) return []; // Optimization
    if (!isSlotMode) return [];
    if (fixedStudentId) return [];
    return getAvailableStudentsForSlot(date, selectedTime, duration, students, lessons);
  }, [isOpen, isSlotMode, fixedStudentId, date, selectedTime, duration, students, lessons]);

  // Filter "Permanent Students" for Teacher View
  const permanentStudents = useMemo(() => {
      if (!fixedTeacherId) return [];
      return availableStudents.filter(s => s.preferredTeacherId === fixedTeacherId);
  }, [fixedTeacherId, availableStudents]);

  // Validate Subscription
  const getSubscriptionError = (student: Student, dur: number) => {
    const sub = student.currentSubscription;
    if (!sub) return "No active subscription.";
    if (sub.status !== SubscriptionStatus.Active) return "Subscription inactive.";
    
    const now = new Date();
    const start = new Date(sub.startDate);
    const end = new Date(sub.endDate);
    if (now < start || now > end) return "Subscription expired.";

    const total = sub.initialBalance + sub.giftLessons;
    const remaining = total - sub.lessonsUsed;
    const cost = dur === 20 ? 1 : 2;

    if (remaining < cost) return `Insufficient balance (${remaining} left).`;
    return null;
  };

  const subscriptionError = useMemo(() => {
    if (!selectedStudent) return null;
    return getSubscriptionError(selectedStudent, duration);
  }, [selectedStudent, duration]);

  const handleBook = () => {
    if (selectedStudent && selectedTeacher && date && selectedTime) {
      // Final check
      const isStudentFree = checkStudentAvailability(selectedStudent.id, date, selectedTime, duration, lessons);
      if (!isStudentFree) {
        alert("The student already has a lesson at this time.");
        return;
      }

      onConfirm({
        studentId: selectedStudent.id,
        teacherId: selectedTeacher.id,
        date,
        startTime: selectedTime,
        duration,
        status: LessonStatus.Scheduled,
        level: selectedStudent.level
      });
      onClose();
    }
  };

  const handleQuickBookStudent = (student: Student) => {
      // Logic for quickly picking a student in Teacher Mode
      const error = getSubscriptionError(student, duration);
      if (error) {
          alert(`Cannot book ${student.fullName}: ${error}`);
          return;
      }
      
      const teacher = teachers.find(t => t.id === fixedTeacherId);
      if (!teacher) return;

      onConfirm({
        studentId: student.id,
        teacherId: teacher.id,
        date,
        startTime: selectedTime,
        duration,
        status: LessonStatus.Scheduled,
        level: student.level
      });
      onClose();
  };

  // !!! EARLY RETURN MOVED HERE TO SATISFY RULES OF HOOKS !!!
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} />
            Book: {date} @ {selectedTime}
          </h2>
          <button onClick={onClose} className="hover:bg-indigo-500 p-2 rounded-full transition"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Duration</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setDuration(20)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${duration === 20 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                20 Mins
              </button>
              <button 
                onClick={() => setDuration(40)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${duration === 40 ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                40 Mins
              </button>
            </div>
          </div>

          {/* === SCENARIO 1: STUDENT SCHEDULE (Student Fixed) === */}
          {fixedStudentId && selectedStudent && (
             <div className="space-y-4">
               <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {selectedStudent.fullName.charAt(0)}
                 </div>
                 <div>
                    <div className="font-bold text-gray-800">{selectedStudent.fullName}</div>
                    <div className="text-xs text-blue-600 font-medium uppercase">{selectedStudent.level}</div>
                 </div>
               </div>

               {selectedTeacherId && selectedTeacher ? (
                   <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                       <p className="text-sm text-green-800 mb-2">Preferred teacher available:</p>
                       <div className="text-lg font-bold text-green-900 mb-4">{selectedTeacher.fullName}</div>
                       <button 
                          onClick={handleBook}
                          disabled={!!subscriptionError}
                          className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           Confirm Booking
                       </button>
                   </div>
               ) : (
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
                       {availableTeachers.length > 0 ? (
                        <select 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                        >
                        <option value="">-- Choose Teacher --</option>
                        {availableTeachers.map(t => (
                            <option key={t.id} value={t.id}>{t.fullName}</option>
                        ))}
                        </select>
                       ) : (
                           <div className="text-red-500 text-sm">No teachers available for this slot/level.</div>
                       )}
                   </div>
               )}
             </div>
          )}

          {/* === SCENARIO 2: TEACHER SCHEDULE (Teacher Fixed) === */}
          {fixedTeacherId && selectedTeacher && (
             <div className="space-y-4">
               <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                    {selectedTeacher.fullName.charAt(0)}
                 </div>
                 <div>
                    <div className="font-bold text-gray-800">{selectedTeacher.fullName}</div>
                    <div className="text-xs text-teal-600 font-medium uppercase">Teacher</div>
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Permanent Students</label>
                 {permanentStudents.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                        {permanentStudents.map(s => {
                            const err = getSubscriptionError(s, duration);
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => handleQuickBookStudent(s)}
                                    disabled={!!err}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition group ${err ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' : 'bg-white border-gray-200 hover:border-indigo-500 hover:shadow-md'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${err ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {s.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{s.fullName}</div>
                                            <div className="text-xs text-gray-500">{s.level}</div>
                                        </div>
                                    </div>
                                    {err ? (
                                        <AlertCircle size={16} className="text-red-400" />
                                    ) : (
                                        <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">Book</div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                 ) : (
                     <div className="text-sm text-gray-400 italic mb-2">No permanent students available for this slot.</div>
                 )}
               </div>
               
               <div className="relative">
                   <div className="absolute inset-0 flex items-center" aria-hidden="true">
                     <div className="w-full border-t border-gray-200"></div>
                   </div>
                   <div className="relative flex justify-center">
                     <span className="px-2 bg-white text-xs text-gray-500">Or select other student</span>
                   </div>
               </div>

               <div>
                 {availableStudents.length > 0 ? (
                    <select 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                    >
                    <option value="">-- Choose Student --</option>
                    {availableStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.level})</option>
                    ))}
                    </select>
                 ) : (
                     <div className="text-red-500 text-sm">No other students available.</div>
                 )}
               </div>
             </div>
          )}

          {/* Validation Messages (Generic) */}
          {selectedStudent && (fixedStudentId || (fixedTeacherId && selectedStudentId && !permanentStudents.find(s=>s.id === selectedStudentId))) && (
             <div className={`p-3 rounded-lg text-sm border flex items-center gap-2 ${subscriptionError ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                {subscriptionError ? <AlertCircle size={16}/> : <Check size={16}/>}
                {subscriptionError || "Subscription valid."}
             </div>
          )}

        </div>

        {/* Footer actions for Standard/Fallback flow */}
        {(!fixedStudentId || !selectedTeacherId) && !(fixedTeacherId && !selectedStudentId) && (
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition">Cancel</button>
            <button 
                onClick={handleBook}
                disabled={!selectedStudentId || !selectedTeacherId || !!subscriptionError}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
            >
                Confirm
            </button>
            </div>
        )}
      </div>
    </div>
  );
};