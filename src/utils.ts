import { Lesson, Student, Teacher, DAYS_OF_WEEK, WorkingHour, LessonStatus, SubscriptionStatus, Level } from './types';

// Helper to add minutes to a time string "HH:MM"
export const addMinutes = (time: string, mins: number): string => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + mins);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

// Check if a time is within a range
export const isTimeInRange = (time: string, start: string, end: string): boolean => {
  const t = parseInt(time.replace(':', ''));
  const s = parseInt(start.replace(':', ''));
  const e = parseInt(end.replace(':', ''));
  return t >= s && t < e; // Exclusive of end time for start of lesson
};

// Check if two intervals overlap
export const doIntervalsOverlap = (start1: string, dur1: number, start2: string, dur2: number): boolean => {
  const s1 = parseInt(start1.replace(':', ''));
  const e1 = parseInt(addMinutes(start1, dur1).replace(':', ''));
  const s2 = parseInt(start2.replace(':', ''));
  const e2 = parseInt(addMinutes(start2, dur2).replace(':', ''));

  return s1 < e2 && s2 < e1;
};

// Get available slots for a teacher on a specific date (Legacy helper, kept for reference)
export const getTeacherSlots = (teacher: Teacher, dateStr: string, existingLessons: Lesson[], duration: 20 | 40): string[] => {
  const date = new Date(dateStr);
  const dayName = DAYS_OF_WEEK[date.getDay()];
  const schedule = teacher.workingHours.find(wh => wh.dayOfWeek === dayName);

  if (!schedule) return [];

  const slots: string[] = [];
  let current = schedule.startHour;
  
  // Create slots every 20 mins until (End - Duration)
  while (true) {
    const lessonEnd = addMinutes(current, duration);
    // Convert to number for comparison
    const endNum = parseInt(schedule.endHour.replace(':', ''));
    const lessonEndNum = parseInt(lessonEnd.replace(':', ''));
    
    if (lessonEndNum > endNum) break;

    // Check collision with existing lessons for this teacher
    const hasConflict = existingLessons.some(l => 
      l.teacherId === teacher.id &&
      l.date === dateStr &&
      l.status !== LessonStatus.Cancelled &&
      doIntervalsOverlap(current, duration, l.startTime, l.duration)
    );

    if (!hasConflict) {
      slots.push(current);
    }

    current = addMinutes(current, 20);
  }

  return slots;
};

// Helper to check student overlaps
export const checkStudentAvailability = (studentId: string, dateStr: string, startTime: string, duration: number, allLessons: Lesson[]): boolean => {
  return !allLessons.some(l => 
    l.studentId === studentId &&
    l.date === dateStr &&
    l.status !== LessonStatus.Cancelled &&
    doIntervalsOverlap(startTime, duration, l.startTime, l.duration)
  );
};

// --- New Helpers for Slot Booking ---

export const getAvailableTeachersForSlot = (
  dateStr: string,
  timeStr: string,
  duration: 20 | 40,
  teachers: Teacher[],
  allLessons: Lesson[],
  studentLevel?: Level
): Teacher[] => {
  // Filter by level if student is known
  let candidates = studentLevel 
    ? teachers.filter(t => t.levels.includes(studentLevel))
    : teachers;

  return candidates.filter(t => {
     // Check working hours
     const dayName = DAYS_OF_WEEK[new Date(dateStr).getDay()];
     const wh = t.workingHours.find(w => w.dayOfWeek === dayName);
     if (!wh) return false;
     if (!isTimeInRange(timeStr, wh.startHour, wh.endHour)) return false;
     
     // Check boundaries
     const endTime = addMinutes(timeStr, duration);
     const whEnd = parseInt(wh.endHour.replace(':',''));
     const lessonEnd = parseInt(endTime.replace(':',''));
     if (lessonEnd > whEnd) return false;

     // Check collisions
     const hasConflict = allLessons.some(l => 
       l.teacherId === t.id &&
       l.date === dateStr &&
       l.status !== LessonStatus.Cancelled &&
       doIntervalsOverlap(timeStr, duration, l.startTime, l.duration)
     );
     return !hasConflict;
  });
};

export const getAvailableStudentsForSlot = (
  dateStr: string, 
  timeStr: string, 
  duration: 20 | 40, 
  students: Student[], 
  allLessons: Lesson[]
): Student[] => {
  return students.filter(s => {
    // Must have active subscription
    if (!s.currentSubscription || s.currentSubscription.status !== SubscriptionStatus.Active) return false;
    
    // Check collisions
    const hasConflict = allLessons.some(l => 
       l.studentId === s.id &&
       l.date === dateStr &&
       l.status !== LessonStatus.Cancelled &&
       doIntervalsOverlap(timeStr, duration, l.startTime, l.duration)
     );
    return !hasConflict;
  });
};

// --- Date Helpers for Schedule Grid ---

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  const diff = d.getDate() - day; 
  return new Date(d.setDate(diff));
};

export const getWeekDays = (startOfWeek: Date): Date[] => {
  const days = [];
  for (let i = 0; i < 6; i++) { // Only Sunday to Friday (6 days)
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
};

export const formatDateYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};