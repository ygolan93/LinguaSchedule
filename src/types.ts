export enum Level {
  Kids = 'Kids',
  Young = 'Young',
  Basic = 'Basic',
  Advanced = 'Advanced',
  Business = 'Business'
}

export enum SubscriptionPackage {
  Gold = 'Gold', // 25
  Topaz = 'Topaz', // 60
  Premium = 'Premium' // 120
}

export enum SubscriptionStatus {
  Active = 'Active',
  NonActive = 'Non-Active',
  Expired = 'Expired'
}

export enum LessonStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export interface WorkingHour {
  dayOfWeek: string; // "Monday", etc.
  startHour: string; // "09:00"
  endHour: string; // "17:00"
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  levels: Level[];
  workingHours: WorkingHour[];
}

export interface Subscription {
  id: string;
  startDate: string;
  endDate: string;
  packageType: SubscriptionPackage;
  giftLessons: number;
  status: SubscriptionStatus;
  lessonsUsed: number;
  initialBalance: number; // Base package amount
}

export interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  phone2?: string;
  idNumber: string;
  level: Level;
  preferredTeacherId?: string; // New field
  currentSubscription?: Subscription; // The active one
  subscriptionHistory: Subscription[]; // Past records
}

export interface Lesson {
  id: string;
  studentId: string;
  teacherId: string;
  date: string; // ISO Date string YYYY-MM-DD
  startTime: string; // "14:00"
  duration: 20 | 40;
  status: LessonStatus;
  level: Level;
}

export const PACKAGE_AMOUNTS: Record<SubscriptionPackage, number> = {
  [SubscriptionPackage.Gold]: 25,
  [SubscriptionPackage.Topaz]: 60,
  [SubscriptionPackage.Premium]: 120,
};

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];