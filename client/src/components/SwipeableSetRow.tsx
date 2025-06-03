import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface SwipeableSetRowProps {
  set: any;
  setIndex: number;
  exerciseIndex: number;
  workoutExercise: any;
  user: any;
  onRemove: (exerciseIndex: number, setIndex: number) => void;
  updateSetValue: (exerciseIndex: number, setIndex: number, field: string, value: any) => void;
  getProgressionMode: (exerciseId: number) => string;
  progressionSuggestions: any;
  getDisplayWeight: (weight: number, exerciseId: number) => number;
  getWeightUnit: (exerciseId: number) => string;
  previousExerciseData: any;
  setSelectedRpeSet: (data: {exerciseIndex: number, setIndex: number}) => void;
}

export const SwipeableSetRow = ({ 
  set, 
  setIndex, 
  exerciseIndex, 
  workoutExercise, 
  user, 
  onRemove, 
  updateSetValue, 
  getProgressionMode,
  progressionSuggestions,
  getDisplayWeight,
  getWeightUnit,
  previousExerciseData,
  setSelectedRpeSet 
}: SwipeableSetRowProps) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [startX, setStartX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = startX - e.touches[0].clientX;
    if (deltaX > 0) {
      setSwipeOffset(Math.min(deltaX, 100));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60) {
      onRemove(exerciseIndex, setIndex);
    }
    setSwipeOffset(0);
  };

  return (
    <div 
      className={`grid ${user?.partialRepsEnabled ? 'md:grid-cols-8 grid-cols-7' : 'md:grid-cols-7 grid-cols-6'} gap-2 items-center py-1 transition-all duration-200 ${swipeOffset > 60 ? 'bg-red-100 border-l-4 border-red-500' : ''}`}
      style={{ transform: `translateX(-${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Set Number */}
      <div className="font-medium text-lg flex items-center space-x-1 hidden md:flex">
        <span>{set.setNumber}</span>
        {set.isPersonalRecord && (
          <span className="text-yellow-500" title="Personal Record">🏆</span>
        )}
      </div>
      
      {/* Previous Data or Progression Suggestion */}
      <div className="text-xs text-neutral-500">
        {(() => {
          const exerciseId = workoutExercise.exercise.id;
          const mode = getProgressionMode(exerciseId);
          
          if (mode === 'suggestion') {
            const suggestion = progressionSuggestions[exerciseId];
            if (suggestion) {
              const displayWeight = getDisplayWeight(suggestion.weight, exerciseId);
              const weightUnit = getWeightUnit(exerciseId);
              return (
                <span className="text-green-600 font-medium">
                  {suggestion.isProgression && "↗ "}{displayWeight}{weightUnit} × {suggestion.reps}
                </span>
              );
            }
            return "No suggestion";
          } else {
            const previousData = previousExerciseData[exerciseId];
            if (previousData && previousData[setIndex]) {
              const prevSet = previousData[setIndex];
              return `${getDisplayWeight(prevSet.weight, exerciseId)}${getWeightUnit(exerciseId)} × ${prevSet.reps}`;
            }
            return `${getDisplayWeight(set.previousWeight || 0, exerciseId)}${getWeightUnit(exerciseId)} × ${set.previousReps || 0}`;
          }
        })()}
      </div>
      
      {/* Weight Input */}
      <div>
        <Input
          type="number"
          value={set.weight || ""}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            updateSetValue(exerciseIndex, setIndex, 'weight', value);
          }}
          className="h-8 text-center border-0 bg-transparent p-0 focus:ring-0 shadow-none"
          placeholder="0"
          step="0.25"
        />
      </div>
      
      {/* Reps Input */}
      <div>
        <Input
          type="number"
          value={set.reps || ""}
          onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
          className="h-8 text-center border-0 bg-transparent p-0 focus:ring-0 shadow-none"
          placeholder="0"
          min="1"
        />
      </div>
      
      {/* Partial Reps Input - Only show when enabled */}
      {user?.partialRepsEnabled && (
        <div>
          <Input
            type="number"
            value={set.partialReps || ""}
            onChange={(e) => updateSetValue(exerciseIndex, setIndex, 'partialReps', parseInt(e.target.value) || 0)}
            className="h-8 text-center border-0 bg-transparent p-0 focus:ring-0 shadow-none"
            placeholder="0"
            min="0"
          />
        </div>
      )}
      
      {/* RPE Selector */}
      <div>
        <Button
          variant="ghost"
          className="h-8 w-full text-center p-0 border-0 bg-transparent hover:bg-gray-100"
          onClick={() => {
            setSelectedRpeSet({exerciseIndex, setIndex});
          }}
        >
          {set.rpe || "-"}
        </Button>
      </div>
      
      {/* Completed Checkbox */}
      <div className="flex justify-center">
        <Checkbox
          checked={set.completed || false}
          onCheckedChange={(checked) => updateSetValue(exerciseIndex, setIndex, 'completed', checked)}
          className="h-4 w-4"
        />
      </div>
      
      {/* Delete Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => onRemove(exerciseIndex, setIndex)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};