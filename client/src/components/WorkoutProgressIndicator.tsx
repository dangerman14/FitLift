import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useLocation } from 'wouter';
import { Clock, Play, Trash2, AlertTriangle } from 'lucide-react';

export default function WorkoutProgressIndicator() {
  const { activeWorkout, setActiveWorkout, isInWorkoutSession } = useWorkout();
  const [, setLocation] = useLocation();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second to keep duration accurate
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Don't show if no active workout or if already in workout session
  if (!activeWorkout || isInWorkoutSession) {
    return null;
  }

  const handleResume = () => {
    setLocation(`/workout-session/${activeWorkout.slug}`);
  };

  const handleDiscardClick = () => {
    setShowDiscardDialog(true);
  };

  const handleConfirmDiscard = () => {
    setActiveWorkout(null);
    setShowDiscardDialog(false);
  };

  const handleCancelDiscard = () => {
    setShowDiscardDialog(false);
  };

  const getElapsedTime = () => {
    // Use adjusted start time if available, otherwise use original start time
    const startTime = new Date(activeWorkout.adjustedStartTime || activeWorkout.startTime);
    const diffInSeconds = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating indicator */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex items-center gap-4 min-w-80">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                Workout in Progress
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {activeWorkout.name} • <Clock className="inline w-3 h-3" /> {getElapsedTime()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleResume}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
            <Button
              onClick={handleDiscardClick}
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Discard confirmation dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Discard Workout?
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to discard your current workout? All progress will be lost and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleConfirmDiscard}
              className="bg-red-600 hover:bg-red-700 text-white flex-1"
            >
              Discard Workout
            </Button>
            <Button
              onClick={handleCancelDiscard}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}