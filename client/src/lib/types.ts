// Common types used across the application
export interface WorkoutSession {
  id: number;
  name: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  exercises: WorkoutExerciseSession[];
}

export interface WorkoutExerciseSession {
  id: number;
  exerciseId: number;
  exercise: {
    id: number;
    name: string;
    muscleGroups: string[];
    equipmentRequired: string[];
  };
  orderIndex: number;
  sets: ExerciseSetSession[];
}

export interface ExerciseSetSession {
  id?: number;
  setNumber: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  isWarmup?: boolean;
  isDropset?: boolean;
  restAfter?: number;
  completed?: boolean;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number;
  avgDuration: number;
  personalRecords: number;
}

export interface StrengthProgress {
  date: Date;
  maxWeight: number;
}

export interface PersonalRecord {
  exercise: string;
  improvement: string;
  gain: string;
  date: string;
}

// Form types for creating/editing data
export interface CreateWorkoutTemplateForm {
  name: string;
  description?: string;
  estimatedDuration?: number;
  difficultyLevel?: string;
  targetMuscleGroups?: string[];
  exercises: CreateTemplateExerciseForm[];
}

export interface CreateTemplateExerciseForm {
  exerciseId: number;
  setsTarget?: number;
  repsTarget?: number;
  weightTarget?: number;
  restDuration?: number;
  notes?: string;
}

export interface CreateExerciseForm {
  name: string;
  description?: string;
  instructions?: string;
  difficultyLevel?: string;
  equipmentRequired?: string[];
  muscleGroups: string[];
  movementPattern?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface CreateFitnessGoalForm {
  goalType: string;
  targetValue?: number;
  currentValue?: number;
  startDate: string;
  targetDate?: string;
  notes?: string;
}

export interface CreateBodyMeasurementForm {
  date: string;
  weight?: number;
  bodyFatPercentage?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  bicepsLeft?: number;
  bicepsRight?: number;
  thighLeft?: number;
  thighRight?: number;
  notes?: string;
}

// Filter and search types
export interface ExerciseFilters {
  muscleGroup?: string;
  equipment?: string;
  difficulty?: string;
  searchQuery?: string;
}

export interface WorkoutFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  templateId?: number;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

// Notification types
export interface NotificationSettings {
  workoutReminders: boolean;
  restTimerSound: boolean;
  achievementAlerts: boolean;
  weeklyReports: boolean;
}

// Theme and preferences
export interface UserPreferences {
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark';
  notifications: NotificationSettings;
  defaultRestTime: number;
  autoStartRest: boolean;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface FormErrors {
  [key: string]: string[];
}

// Utility types
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export type TimeRange = '7d' | '30d' | '3m' | '6m' | '1y' | 'all';

export type ExerciseCategory = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'arms' 
  | 'legs' 
  | 'core' 
  | 'cardio'
  | 'full-body';

export type WorkoutType = 
  | 'strength' 
  | 'cardio' 
  | 'hiit' 
  | 'flexibility' 
  | 'sports'
  | 'rehabilitation';

export type MuscleGroup = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

export type Equipment = 
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance-band'
  | 'medicine-ball'
  | 'suspension-trainer';
