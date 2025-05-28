import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface ActiveWorkout {
  id: string;
  name: string;
  startTime: string;
  slug: string;
  adjustedStartTime?: string; // For when user manually changes duration
}

interface WorkoutContextType {
  activeWorkout: ActiveWorkout | null;
  setActiveWorkout: (workout: ActiveWorkout | null) => void;
  isInWorkoutSession: boolean;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkoutState] = useState<ActiveWorkout | null>(null);
  const [location] = useLocation();
  
  // Check if currently in a workout session
  const isInWorkoutSession = location.startsWith('/workout-session/');

  const setActiveWorkout = (workout: ActiveWorkout | null) => {
    console.log('Setting active workout:', workout);
    setActiveWorkoutState(workout);
    // Store in localStorage for persistence
    if (workout) {
      localStorage.setItem('activeWorkout', JSON.stringify(workout));
    } else {
      localStorage.removeItem('activeWorkout');
    }
  };

  // Load active workout from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('activeWorkout');
    if (stored) {
      try {
        const workout = JSON.parse(stored);
        // Only set active workout if it's not already cleared
        if (workout && workout.id) {
          setActiveWorkoutState(workout);
        }
      } catch (error) {
        console.error('Failed to parse stored workout:', error);
        localStorage.removeItem('activeWorkout');
      }
    }
  }, []);

  // Don't automatically clear active workout - let it persist until explicitly cleared
  // This allows the protection system to work properly

  return (
    <WorkoutContext.Provider value={{
      activeWorkout,
      setActiveWorkout,
      isInWorkoutSession
    }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}