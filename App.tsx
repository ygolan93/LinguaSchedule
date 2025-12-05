import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, GraduationCap, Calendar, Plus, Filter, AlertTriangle, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Student, Teacher, Lesson, Level, SubscriptionPackage, SubscriptionStatus, LessonStatus, DAYS_OF_WEEK } from './types';
import { BookingModal } from './components/BookingModal';
import { StudentModal } from './components/StudentModal';
import { TeacherModal } from './components/TeacherModal';
import { LessonModal } from './components/LessonModal';
import { addMinutes, getStartOfWeek, getWeekDays, formatDateYYYYMMDD, formatDisplayDate, isTimeInRange, doIntervalsOverlap } from './utils';

// --- CONSTANTS ---
const NEW_STUDENT_TEMPLATE: Student = {
  id: '',
  fullName: '',
  email: '',
  phone: '',
  idNumber: '',
  level: Level.Basic,
  subscriptionHistory: [],
  currentSubscription: undefined,
  preferredTeacherId: ''
};

const NEW_TEACHER_TEMPLATE: Teacher = {
  id: '',
  fullName: '',
  email: '',
  phone: '',
  levels: [],
  workingHours: []
};

// --- MOCK DATA HELPERS ---
const getTodayStr = (offsetDays: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const MOCK_TEACHERS: Teacher[] = [
  {
    id: 't1',
    fullName: 'Sarah Smith',
    email: 'sarah@linguasched.com',
    phone: '555-0101',
    levels: [Level.Kids, Level.Young, Level.Basic],
    workingHours: [
      { dayOfWeek: 'Sunday', startHour: '09:00', endHour: '17:00' },
      { dayOfWeek: 'Monday', startHour: '09:00', endHour: '17:00' },
      { dayOfWeek: 'Wednesday', startHour: '09:00', endHour: '15:00' }
    ]
  },
  {
    id: 't2',
    fullName: 'David Chen',
    email: 'david@linguasched.com',
    phone: '555-0102',
    levels: [Level.Advanced, Level.Business],
    workingHours: [
      { dayOfWeek: 'Tuesday', startHour: '12:00', endHour: '20:00' },
      { dayOfWeek: 'Thursday', startHour: '12:00', endHour: '20:00' },
      { dayOfWeek: 'Friday', startHour: '08:00', endHour: '14:00' }
    ]
  }
];

const MOCK_STUDENTS: Student[] = [
  {
    id: 's1',
    fullName: 'Alice Johnson',
    email: 'alice@test.com',
    phone: '555-1111',
    idNumber: 'ID001',
    level: Level.Basic,
    preferredTeacherId: 't1',
    subscriptionHistory: [],
    currentSubscription: {
      id: 'sub1',
      packageType: SubscriptionPackage.Gold,
      initialBalance: 25,
      giftLessons: 2,
      lessonsUsed: 5,
      startDate: '2023-10-01',
      endDate: '2025-12-31',
      status: SubscriptionStatus.Active
    }
  },
  {
    id: 's2',
    fullName: 'Bob Brown',
    email: 'bob@test.com',
    phone: '555-2222',
    idNumber: 'ID002',
    level: Level.Business,
    subscriptionHistory: [],
    currentSubscription: {
      id: 'sub2',
      packageType: SubscriptionPackage.Premium,
      initialBalance: 120,
      giftLessons: 0,
      lessonsUsed: 119,
      startDate: '2023-01-01',
      endDate: '2025-12-31',
      status: SubscriptionStatus.Active
    }
  }
];

// Initialize with some lessons for THIS week
const MOCK_LESSONS: Lesson[] = [
  { id: 'l1', studentId: 's1', teacherId: 't1', date: getTodayStr(0), startTime: '10:00', duration: 40, status: LessonStatus.Scheduled, level: Level.Basic },
  { id: 'l2', studentId: 's1', teacherId: 't1', date: getTodayStr(2), startTime: '14:00', duration: 20, status: LessonStatus.Scheduled, level: Level.Basic },
  { id: 'l3', studentId: 's2', teacherId: 't2', date: getTodayStr(1), startTime: '13:00', duration: 40, status: LessonStatus.Scheduled, level: Level.Business },
  { id: 'l4', studentId: 's2', teacherId: 't2', date: getTodayStr(3), startTime: '09:00', duration: 20, status: LessonStatus.Scheduled, level: Level.Business },
];

// Helper to sanitize percentage values for styles
const safePct = (val: number): string => {
  if (!Number.isFinite(val) || Number.isNaN(val)) return '0%';
  return `${Math.max(0, Math.min(100, val))}%`;
};

export default function App() {
  const [view, setView] = useState<'schedule' | 'students' | 'teachers'>('schedule');
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [lessons, setLessons] = useState<Lesson[]>(MOCK_LESSONS);
  
  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<{date: string, time: string, studentId?: string, teacherId?: string} | null>(null);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Schedule View State
  const [scheduleMode, setScheduleMode] = useState<'student' | 'teacher'>('student');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Initialize selected entity
  useEffect(() => {
    if (!selectedEntityId) {
      if (scheduleMode === 'student' && students.length > 0) setSelectedEntityId(students[0].id);
      if (scheduleMode === 'teacher' && teachers.length > 0) setSelectedEntityId(teachers[0].id);
    }
  }, [scheduleMode, students, teachers, selectedEntityId]);

  // --- ACTIONS ---

  const handleCreateBooking = (newLessonData: Omit<Lesson, 'id'>) => {
    const newLesson: Lesson = {
      ...newLessonData,
      id: Math.random().toString(36).substr(2, 9),
    };

    setLessons(prev => [...prev, newLesson]);

    // Deduct from Subscription
    setStudents(prev => prev.map(s => {
      if (s.id === newLesson.studentId && s.currentSubscription) {
        const cost = newLesson.duration === 20 ? 1 : 2;
        return {
          ...s,
          currentSubscription: {
            ...s.currentSubscription,
            lessonsUsed: s.currentSubscription.lessonsUsed + cost
          }
        };
      }
      return s;
    }));
  };

  const handleCancelLesson = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    const lessonDateTime = new Date(`${lesson.date}T${lesson.startTime}`);
    const now = new Date();
    const diffMs = lessonDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const isRefundable = diffHours > 24;

    // 1. Update Lesson Status
    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, status: LessonStatus.Cancelled } : l));

    // 2. Refund logic
    if (isRefundable) {
        setStudents(prev => prev.map(s => {
            if (s.id === lesson.studentId && s.currentSubscription) {
                const cost = lesson.duration === 20 ? 1 : 2;
                return {
                    ...s,
                    currentSubscription: {
                        ...s.currentSubscription,
                        lessonsUsed: Math.max(0, s.currentSubscription.lessonsUsed - cost)
                    }
                };
            }
            return s;
        }));
    }
    
    setSelectedLessonId(null);
  };

  const handleSaveStudent = (studentData: Student) => {
    if (!studentData.id) {
      const newStudent = { ...studentData, id: Math.random().toString(36).substr(2, 9) };
      setStudents(prev => [...prev, newStudent]);
      if (scheduleMode === 'student' && !selectedEntityId) setSelectedEntityId(newStudent.id);
    } else {
      setStudents(prev => prev.map(s => s.id === studentData.id ? studentData : s));
    }
  };

  const handleSaveTeacher = (teacherData: Teacher) => {
    if (!teacherData.id) {
      const newTeacher = { ...teacherData, id: Math.random().toString(36).substr(2, 9) };
      setTeachers(prev => [...prev, newTeacher]);
      if (scheduleMode === 'teacher' && !selectedEntityId) setSelectedEntityId(newTeacher.id);
    } else {
      setTeachers(prev => prev.map(t => t.id === teacherData.id ? teacherData : t));
    }
  };

  const handleWeekChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  const handleSlotClick = (dateStr: string, timeStr: string) => {
    if (scheduleMode === 'student') {
       const student = students.find(s => s.id === selectedEntityId);
       // Booking for current selected student
       // If student has a preferred teacher, we pre-select that teacher
       setBookingSlot({ 
         date: dateStr, 
         time: timeStr, 
         studentId: selectedEntityId,
         teacherId: student?.preferredTeacherId
       });
       setIsBookingOpen(true);
    } else {
       // Booking for current selected teacher
       setBookingSlot({ date: dateStr, time: timeStr, teacherId: selectedEntityId });
       setIsBookingOpen(true);
    }
  };

  // --- VIEWS ---

  const renderSchedule = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = getWeekDays(startOfWeek);
    const GRID_START_HOUR = 7;
    const GRID_END_HOUR = 21;
    const TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;

    const isStudentMode = scheduleMode === 'student';
    const currentStudent = isStudentMode ? students.find(s => s.id === selectedEntityId) : null;
    const preferredTeacher = currentStudent?.preferredTeacherId ? teachers.find(t => t.id === currentStudent.preferredTeacherId) : null;

    // Filter logic
    const displayedLessons = lessons.filter(l => {
      if (isStudentMode && l.studentId !== selectedEntityId) return false;
      if (!isStudentMode && l.teacherId !== selectedEntityId) return false;
      if (l.status === LessonStatus.Cancelled) return false;
      return true;
    });

    // Determine constraints
    // If student mode AND preferredTeacher is set, we need to show availability based on that teacher
    // If teacher mode, we show availability based on selectedEntityId
    const effectiveTeacherForAvailability = !isStudentMode 
        ? teachers.find(t => t.id === selectedEntityId) 
        : preferredTeacher;
    
    // Background color: Gray if we are constraining availability, White if free-for-all
    const gridBgClass = effectiveTeacherForAvailability ? 'bg-gray-200' : 'bg-white';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-140px)]">
        {/* Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-4">
             {/* Toggle */}
             <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm">
                <button 
                  onClick={() => { setScheduleMode('student'); setSelectedEntityId(students[0]?.id || ''); }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${scheduleMode === 'student' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Student Schedule
                </button>
                <button 
                  onClick={() => { setScheduleMode('teacher'); setSelectedEntityId(teachers[0]?.id || ''); }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${scheduleMode === 'teacher' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Teacher Schedule
                </button>
             </div>

             {/* Selector */}
             <div className="relative flex items-center gap-2">
               <select 
                 value={selectedEntityId}
                 onChange={(e) => setSelectedEntityId(e.target.value)}
                 className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 min-w-[200px]"
               >
                 {scheduleMode === 'student' 
                    ? students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)
                    : teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)
                 }
               </select>
               {isStudentMode && preferredTeacher && (
                   <div className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded">
                       Pref: {preferredTeacher.fullName}
                   </div>
               )}
             </div>
          </div>

          {/* Date Nav */}
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <button onClick={() => handleWeekChange(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={20} /></button>
            <span className="text-sm font-semibold text-gray-700 min-w-[150px] text-center">
              {formatDisplayDate(startOfWeek)} - {formatDisplayDate(weekDays[5])}
            </span>
            <button onClick={() => handleWeekChange(1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto overflow-x-auto relative">
           <div className="min-w-[800px] h-full flex">
             {/* Time Axis */}
             <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50">
                <div className="h-10 border-b border-gray-200"></div> {/* Header Spacer */}
                <div className="relative" style={{ height: `${TOTAL_HOURS * 60}px` }}> 
                   {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
                     <div key={i} className="absolute w-full text-right pr-2 text-xs text-gray-400 -mt-2.5" style={{ top: safePct((i / TOTAL_HOURS) * 100) }}>
                        {(GRID_START_HOUR + i).toString().padStart(2, '0')}:00
                     </div>
                   ))}
                </div>
             </div>

             {/* Columns */}
             <div className="flex-1 flex">
               {weekDays.map((dayDate, dayIdx) => {
                 const dateStr = formatDateYYYYMMDD(dayDate);
                 const dayName = DAYS_OF_WEEK[dayDate.getDay()];
                 const dayLessons = displayedLessons.filter(l => l.date === dateStr);
                 
                 // 1. Working Hours (White Blocks)
                 let workingBlocks: {start: number, height: number}[] = [];
                 if (effectiveTeacherForAvailability) {
                    const wh = effectiveTeacherForAvailability.workingHours.find(w => w.dayOfWeek === dayName);
                    if (wh) {
                        const startMins = (parseInt(wh.startHour.split(':')[0]) * 60) + parseInt(wh.startHour.split(':')[1]);
                        const endMins = (parseInt(wh.endHour.split(':')[0]) * 60) + parseInt(wh.endHour.split(':')[1]);
                        const gridStartMins = GRID_START_HOUR * 60;
                        
                        const top = Math.max(0, startMins - gridStartMins);
                        const duration = Math.max(0, endMins - startMins);
                        
                        const topPercent = (top / (TOTAL_HOURS * 60)) * 100;
                        const heightPercent = (duration / (TOTAL_HOURS * 60)) * 100;
                        workingBlocks.push({ start: topPercent, height: heightPercent });
                    }
                 }

                 // 2. Conflict Blocks (Red Blocks)
                 // Only relevant for Student Mode with a Preferred Teacher
                 let conflictBlocks: {id: string, start: number, height: number, label: string}[] = [];
                 if (isStudentMode && preferredTeacher) {
                     const teacherLessons = lessons.filter(l => 
                        l.teacherId === preferredTeacher.id && 
                        l.date === dateStr &&
                        l.status !== LessonStatus.Cancelled &&
                        l.studentId !== currentStudent?.id // Don't count current student's own lessons as "conflicts"
                     );

                     teacherLessons.forEach(l => {
                        const [h, m] = l.startTime.split(':').map(Number);
                        const startMins = (h * 60) + m;
                        const gridStartMins = GRID_START_HOUR * 60;
                        const offsetMins = startMins - gridStartMins;
                        
                        const topPercent = (offsetMins / (TOTAL_HOURS * 60)) * 100;
                        const heightPercent = (l.duration / (TOTAL_HOURS * 60)) * 100;
                        const otherStudentName = students.find(s => s.id === l.studentId)?.fullName || 'Unknown Student';

                        conflictBlocks.push({ id: l.id, start: topPercent, height: heightPercent, label: otherStudentName });
                     });
                 }

                 return (
                   <div key={dayIdx} className={`flex-1 border-r border-gray-100 min-w-[120px] relative group ${gridBgClass}`}>
                     {/* Column Header */}
                     <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 sticky top-0 z-10">
                        <div className={`text-center ${dateStr === formatDateYYYYMMDD(new Date()) ? 'text-indigo-600 font-bold' : ''}`}>
                          {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                          <span className="ml-1 text-xs text-gray-400">{dayDate.getDate()}</span>
                        </div>
                     </div>

                     {/* Grid Body */}
                     <div className="relative h-full w-full">
                       
                       {/* Layer 1: Working Hours (White) */}
                       {effectiveTeacherForAvailability && workingBlocks.map((block, idx) => (
                          <div 
                             key={`wh-${idx}`} 
                             className="absolute w-full bg-white z-0" 
                             style={{ top: safePct(block.start), height: safePct(block.height) }}
                          />
                       ))}

                       {/* Layer 2: Conflict Blocks (Red) - Only for Student Mode + Pref Teacher */}
                       {conflictBlocks.map(block => (
                           <div 
                             key={`conflict-${block.id}`}
                             className="absolute w-full bg-red-100 border-l-4 border-red-500 z-0 flex items-center justify-center text-xs text-red-700 font-medium overflow-hidden"
                             style={{ top: safePct(block.start), height: safePct(block.height) }}
                             title={`Teacher booked with: ${block.label}`}
                           >
                              <span className="truncate px-1">{block.label}</span>
                           </div>
                       ))}

                       {/* Layer 3: Interactive Click Layer */}
                       <div 
                          className="absolute inset-0 z-0"
                          onClick={(e) => {
                             const rect = e.currentTarget.getBoundingClientRect();
                             const y = e.clientY - rect.top;
                             // Ensure we don't divide by zero or get NaN
                             if (!rect.height) return;

                             const percent = y / rect.height;
                             const minutesFromStart = percent * (TOTAL_HOURS * 60);
                             const clickedTimeMins = (GRID_START_HOUR * 60) + minutesFromStart;
                             
                             // Snap to 20 mins
                             const snapMins = Math.floor(clickedTimeMins / 20) * 20;
                             const h = Math.floor(snapMins / 60);
                             const m = snapMins % 60;
                             
                             // Sanity check
                             if (h < GRID_START_HOUR || h >= GRID_END_HOUR) return;

                             const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;

                             // Validation
                             if (effectiveTeacherForAvailability) {
                                // Check Working Hours (Gray Check)
                                const day = DAYS_OF_WEEK[dayDate.getDay()];
                                const wh = effectiveTeacherForAvailability.workingHours.find(w => w.dayOfWeek === day);
                                if (!wh || !isTimeInRange(timeStr, wh.startHour, wh.endHour)) {
                                    return; // Clicked on Gray
                                }

                                // Check Conflict (Red Check) - Only for Student Mode
                                if (isStudentMode && preferredTeacher) {
                                    const hasConflict = lessons.some(l => 
                                        l.teacherId === preferredTeacher.id &&
                                        l.date === dateStr &&
                                        l.status !== LessonStatus.Cancelled &&
                                        l.studentId !== currentStudent?.id &&
                                        doIntervalsOverlap(timeStr, 20, l.startTime, l.duration) 
                                    );
                                    if (hasConflict) return; // Clicked on Red
                                }
                             }

                             handleSlotClick(dateStr, timeStr);
                          }}
                       ></div>

                       {/* Grid Lines */}
                       {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                         <div key={i} className="absolute w-full border-b border-gray-50 pointer-events-none" style={{ top: safePct(((i + 1) / TOTAL_HOURS) * 100), height: '0px' }}></div>
                       ))}

                       {/* Layer 4: Actual Lessons (Blue) */}
                       {dayLessons.map(lesson => {
                         const [h, m] = lesson.startTime.split(':').map(Number);
                         const startMins = (h * 60) + m;
                         const gridStartMins = GRID_START_HOUR * 60;
                         const offsetMins = startMins - gridStartMins;
                         
                         const topPercent = (offsetMins / (TOTAL_HOURS * 60)) * 100;
                         const heightPercent = (lesson.duration / (TOTAL_HOURS * 60)) * 100;
                         
                         const counterpartName = isStudentMode 
                            ? teachers.find(t => t.id === lesson.teacherId)?.fullName 
                            : students.find(s => s.id === lesson.studentId)?.fullName;

                         return (
                           <div 
                             key={lesson.id}
                             className="absolute left-1 right-1 rounded-md bg-blue-600 text-white p-1 shadow-sm overflow-hidden text-xs z-10 hover:z-20 hover:bg-blue-700 transition cursor-pointer border border-blue-500 pointer-events-auto"
                             style={{ 
                               top: safePct(topPercent), 
                               height: safePct(heightPercent),
                               minHeight: '24px'
                             }}
                             title={`${lesson.startTime} - ${counterpartName} (${lesson.duration}m)`}
                             onClick={(e) => {
                                 e.stopPropagation(); // Prevent slot booking
                                 setSelectedLessonId(lesson.id);
                             }}
                           >
                             <div className="font-bold leading-tight">{lesson.startTime}</div>
                             <div className="truncate opacity-90">{counterpartName}</div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
        </div>
      </div>
    );
  };

  const renderStudents = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Add New Student Card */}
      <div 
        onClick={() => setEditingStudent({ ...NEW_STUDENT_TEMPLATE })}
        className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition cursor-pointer flex flex-col items-center justify-center min-h-[200px] group"
      >
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-indigo-600 shadow-sm mb-3">
            <Plus size={24} />
        </div>
        <span className="text-gray-500 font-medium group-hover:text-indigo-700">Add New Student</span>
      </div>

      {students.map(s => {
         const activeSub = s.currentSubscription;
         const total = activeSub ? activeSub.initialBalance + activeSub.giftLessons : 0;
         const rem = activeSub ? total - activeSub.lessonsUsed : 0;
         const isLow = rem < 5;
         const prefTeacher = teachers.find(t => t.id === s.preferredTeacherId);

         return (
          <div key={s.id} onClick={() => setEditingStudent(s)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600">{s.fullName}</h3>
                <p className="text-sm text-gray-500">{s.email}</p>
                {prefTeacher && <p className="text-xs text-indigo-500 mt-1">Pref: {prefTeacher.fullName}</p>}
              </div>
              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-medium">{s.level}</span>
            </div>
            {activeSub ? (
               <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{activeSub.packageType}</span>
                    <span className={activeSub.status === 'Active' ? 'text-green-600' : 'text-red-500'}>{activeSub.status}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: safePct(total > 0 ? (activeSub.lessonsUsed / total) * 100 : 0) }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-700">{rem} lessons left</span>
                    {isLow && <AlertTriangle size={14} className="text-orange-500" />}
                  </div>
               </div>
            ) : (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">No Active Subscription</div>
            )}
          </div>
         )
      })}
    </div>
  );

  const renderTeachers = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Add New Teacher Card */}
      <div 
        onClick={() => setEditingTeacher({ ...NEW_TEACHER_TEMPLATE })}
        className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-500 hover:bg-teal-50 transition cursor-pointer flex flex-col items-center justify-center min-h-[200px] group"
      >
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-teal-600 shadow-sm mb-3">
            <Plus size={24} />
        </div>
        <span className="text-gray-500 font-medium group-hover:text-teal-700">Add New Teacher</span>
      </div>

      {teachers.map(t => (
        <div key={t.id} onClick={() => setEditingTeacher(t)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-lg">
               {t.fullName.charAt(0)}
             </div>
             <div>
               <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600">{t.fullName}</h3>
               <p className="text-sm text-gray-500">{t.email}</p>
             </div>
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {t.levels.map(l => <span key={l} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{l}</span>)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              <span className="font-semibold">Works:</span> {t.workingHours.map(wh => wh.dayOfWeek.substr(0,3)).join(', ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen z-40 hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">LinguaSched</h1>
          <p className="text-xs text-slate-400 mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView('schedule')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'schedule' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Calendar size={20} /> Schedule
          </button>
          <button onClick={() => setView('students')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <GraduationCap size={20} /> Students
          </button>
          <button onClick={() => setView('teachers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'teachers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Users size={20} /> Teachers
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-8 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-xl font-semibold capitalize text-gray-800">{view} Overview</h2>
          {/* Removed New Booking Button */}
        </header>

        <div className="p-8">
           {view === 'schedule' && renderSchedule()}
           {view === 'students' && renderStudents()}
           {view === 'teachers' && renderTeachers()}
        </div>
      </main>

      {/* Modals */}
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => { setIsBookingOpen(false); setBookingSlot(null); }}
        students={students}
        teachers={teachers}
        lessons={lessons}
        onConfirm={handleCreateBooking}
        initialDate={bookingSlot?.date}
        initialTime={bookingSlot?.time}
        fixedStudentId={bookingSlot?.studentId}
        fixedTeacherId={bookingSlot?.teacherId}
      />

      <LessonModal
        isOpen={!!selectedLessonId}
        onClose={() => setSelectedLessonId(null)}
        lesson={lessons.find(l => l.id === selectedLessonId) || null}
        student={students.find(s => s.id === lessons.find(l => l.id === selectedLessonId)?.studentId)}
        teacher={teachers.find(t => t.id === lessons.find(l => l.id === selectedLessonId)?.teacherId)}
        onCancel={handleCancelLesson}
      />

      {editingStudent && (
        <StudentModal 
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          student={editingStudent}
          onUpdate={handleSaveStudent}
          teachers={teachers}
          upcomingLessons={lessons.filter(l => l.studentId === editingStudent.id && l.status === LessonStatus.Scheduled)}
        />
      )}

      {editingTeacher && (
        <TeacherModal
          isOpen={!!editingTeacher}
          onClose={() => setEditingTeacher(null)}
          teacher={editingTeacher}
          onUpdate={handleSaveTeacher}
        />
      )}
    </div>
  );
}