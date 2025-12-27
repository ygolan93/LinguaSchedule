import React from 'react';
import { Lesson, Student, Teacher, LessonStatus } from '../src/types';
import { X, Calendar, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { addMinutes } from '../src/utils';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  student?: Student;
  teacher?: Teacher;
  onCancel: (lessonId: string) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen, onClose, lesson, student, teacher, onCancel
}) => {
  if (!isOpen || !lesson) return null;

  const lessonDateTime = new Date(`${lesson.date}T${lesson.startTime}`);
  const now = new Date();
  const diffMs = lessonDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const isRefundable = diffHours > 24;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 bg-indigo-600 text-white flex justify-between items-center">
            <h3 className="text-lg font-bold">Lesson Details</h3>
            <button onClick={onClose} className="hover:bg-indigo-500 p-1 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {lesson.duration}
                </div>
                <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold">Duration</div>
                    <div className="font-medium text-gray-900">{lesson.duration} Minutes</div>
                </div>
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-gray-700">{lesson.date}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-gray-700">{lesson.startTime} - {addMinutes(lesson.startTime, lesson.duration)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <User size={16} className="text-gray-400" />
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Student</span>
                        <span className="text-gray-700 font-medium">{student?.fullName || 'Unknown'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <User size={16} className="text-gray-400" />
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Teacher</span>
                        <span className="text-gray-700 font-medium">{teacher?.fullName || 'Unknown'}</span>
                    </div>
                </div>
            </div>

            {lesson.status === LessonStatus.Scheduled ? (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Cancellation</h4>
                    {isRefundable ? (
                        <p className="text-xs text-green-600 flex items-start gap-1 mb-3">
                            <CheckCircle size={14} className="mt-0.5 shrink-0" /> 
                            <span>Over 24h notice. Credit will be returned.</span>
                        </p>
                    ) : (
                        <p className="text-xs text-amber-600 flex items-start gap-1 mb-3">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> 
                            <span>Under 24h notice. No credit refund.</span>
                        </p>
                    )}
                    
                    <button 
                        onClick={() => onCancel(lesson.id)}
                        className="w-full py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium text-sm transition shadow-sm"
                    >
                        Cancel Lesson
                    </button>
                </div>
            ) : (
                <div className="p-3 bg-gray-100 rounded text-center text-gray-500 text-sm italic">
                    This lesson is {lesson.status.toLowerCase()}.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};