import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  X,
  ArrowLeft,
  Save,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  ArrowUp,
  ArrowDown
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Exercise types from schema
type ExerciseType = 'weight_reps' | 'bodyweight_reps' | 'assisted_bodyweight' | 'weighted_bodyweight' | 'duration' | 'distance_duration' | 'weight_distance';

interface RoutineSet {
  reps?: string; // Will store as "10-12" format
  weight?: string;
  duration?: string; // For duration-based exercises
  distance?: string; // For distance-based exercises
  assistanceWeight?: string; // For assisted bodyweight exercises
  rpe?: string; // Rate of Perceived Exertion (1-10)
}

interface RoutineExercise {
  exerciseId: number;
  exerciseName: string;
  sets: RoutineSet[];
  restDuration: number; // Rest time in seconds for all sets
  notes?: string;
  supersetId?: string; // Groups exercises into supersets
}

export default function CreateRoutine() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [routineImageUrl, setRoutineImageUrl] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number | "">("");
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("all");

  // Superset modal state
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  const [selectedExercisesForSuperset, setSelectedExercisesForSuperset] = useState<number[]>([]);

  // Weight unit preferences
  const [weightUnitOverride, setWeightUnitOverride] = useState<{[exerciseId: number]: 'kg' | 'lbs'}>({});

  // Fetch exercises
  const { data: exercises, isLoading } = useQuery({
    queryKey: ['/api/exercises'],
  });

  // Muscle groups for filtering
  const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Abs', 'Cardio'
  ];

  // Filter exercises based on search and muscle group
  const filteredExercises = {
    data: exercises?.data?.filter((exercise: any) => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMuscleGroup = selectedMuscleGroup === 'all' || 
        exercise.muscleGroups?.some((group: string) => group === selectedMuscleGroup);
      return matchesSearch && matchesMuscleGroup;
    }) || []
  };

  // Add exercise to routine
  const addExerciseToRoutine = (exercise: any) => {
    const newExercise: RoutineExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [{ reps: "", weight: "" }], // Start with one empty set
      restDuration: 60, // Default 60 seconds rest
      notes: "",
    };
    setSelectedExercises([...selectedExercises, newExercise]);
  };

  // Remove exercise from routine
  const removeExerciseFromRoutine = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  // Move exercise up in the list
  const moveExerciseUp = (index: number) => {
    if (index === 0) return;
    const newExercises = [...selectedExercises];
    [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
    setSelectedExercises(newExercises);
  };

  // Move exercise down in the list
  const moveExerciseDown = (index: number) => {
    if (index === selectedExercises.length - 1) return;
    const newExercises = [...selectedExercises];
    [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
    setSelectedExercises(newExercises);
  };

  // Add set to exercise
  const addSetToExercise = (exerciseIndex: number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].sets.push({ reps: "", weight: "" });
    setSelectedExercises(updatedExercises);
  };

  // Remove set from exercise
  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    setSelectedExercises(updatedExercises);
  };

  // Update set field
  const updateSetField = (exerciseIndex: number, setIndex: number, field: keyof RoutineSet, value: string) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    setSelectedExercises(updatedExercises);
  };

  // Update exercise rest time
  const updateExerciseRestTime = (exerciseIndex: number, restDuration: number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].restDuration = restDuration;
    setSelectedExercises(updatedExercises);
  };

  // Superset functionality
  const getSupersetsInUse = () => {
    const supersets = new Set<string>();
    selectedExercises.forEach(exercise => {
      if (exercise.supersetId) {
        supersets.add(exercise.supersetId);
      }
    });
    return Array.from(supersets);
  };

  const openSupersetModal = (exerciseIndex: number) => {
    setCurrentExerciseIndex(exerciseIndex);
    setSelectedExercisesForSuperset([]);
    setShowSupersetModal(true);
  };

  const createSuperset = () => {
    if (currentExerciseIndex === null || selectedExercisesForSuperset.length === 0) return;

    const supersetId = `Superset ${getSupersetsInUse().length + 1}`;
    const updatedExercises = [...selectedExercises];

    // Add superset ID to current exercise
    updatedExercises[currentExerciseIndex].supersetId = supersetId;

    // Add superset ID to selected exercises
    selectedExercisesForSuperset.forEach(index => {
      updatedExercises[index].supersetId = supersetId;
    });

    setSelectedExercises(updatedExercises);
    setShowSupersetModal(false);
    setCurrentExerciseIndex(null);
    setSelectedExercisesForSuperset([]);
  };

  const addToSuperset = (exerciseIndex: number, supersetId: string) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].supersetId = supersetId;
    setSelectedExercises(updatedExercises);
  };

  const removeFromSuperset = (exerciseIndex: number) => {
    const updatedExercises = [...selectedExercises];
    delete updatedExercises[exerciseIndex].supersetId;
    setSelectedExercises(updatedExercises);
  };

  // Save routine mutation
  const saveRoutineMutation = useMutation({
    mutationFn: async (routineData: any) => {
      const response = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routineData),
      });
      if (!response.ok) throw new Error('Failed to save routine');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Routine saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/routines'] });
      setLocation('/routines');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save routine. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveRoutine = () => {
    if (!routineName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a routine name.",
        variant: "destructive",
      });
      return;
    }

    if (selectedExercises.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one exercise to the routine.",
        variant: "destructive",
      });
      return;
    }

    const routineData = {
      name: routineName,
      description: routineDescription || null,
      imageUrl: routineImageUrl || null,
      estimatedDuration: estimatedDuration || null,
      exercises: selectedExercises.map((exercise, index) => ({
        exerciseId: exercise.exerciseId,
        orderIndex: index,
        sets: exercise.sets,
        restDuration: exercise.restDuration,
        notes: exercise.notes || null,
        supersetId: exercise.supersetId || null,
      })),
    };

    saveRoutineMutation.mutate(routineData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/routines')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Routines
            </Button>
            <h1 className="text-2xl font-bold">Create New Routine</h1>
          </div>
        </div>

        {/* Routine Details Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Routine Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="routineName">Routine Name *</Label>
              <Input
                id="routineName"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="Enter routine name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="60"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="routineDescription">Description</Label>
              <Textarea
                id="routineDescription"
                value={routineDescription}
                onChange={(e) => setRoutineDescription(e.target.value)}
                placeholder="Describe your routine..."
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="routineImageUrl">Image URL</Label>
              <Input
                id="routineImageUrl"
                value={routineImageUrl}
                onChange={(e) => setRoutineImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Selected Exercises */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Exercises ({selectedExercises.length})</h2>
          </div>

          {selectedExercises.length > 0 ? (
            <div className="space-y-4">
              {selectedExercises.map((exercise, exerciseIndex) => (
                <div key={`${exercise.exerciseId}-${exerciseIndex}`} className="border rounded-lg p-4">
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {exercise.supersetId && (
                        <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {exercise.supersetId}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{exercise.exerciseName}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{exercise.sets.length} sets</span>
                          <span>•</span>
                          <span>{exercise.restDuration}s rest</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Exercise Reordering Buttons */}
                      <Button
                        onClick={() => moveExerciseUp(exerciseIndex)}
                        variant="ghost"
                        size="sm"
                        disabled={exerciseIndex === 0}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => moveExerciseDown(exerciseIndex)}
                        variant="ghost"
                        size="sm"
                        disabled={exerciseIndex === selectedExercises.length - 1}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>

                      {/* Rest Time Selector */}
                      <Select 
                        value={exercise.restDuration.toString()} 
                        onValueChange={(value) => updateExerciseRestTime(exerciseIndex, parseInt(value))}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-40">
                          {/* 5 second intervals up to 2 minutes */}
                          {Array.from({ length: 24 }, (_, i) => (i + 1) * 5).map(seconds => (
                            <SelectItem key={seconds} value={seconds.toString()}>
                              {seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`}
                            </SelectItem>
                          ))}
                          
                          {/* 15 second intervals from 2m 15s to 5 minutes */}
                          {Array.from({ length: 12 }, (_, i) => 120 + (i + 1) * 15).map(seconds => (
                            <SelectItem key={seconds} value={seconds.toString()}>
                              {Math.floor(seconds / 60)}m {seconds % 60}s
                            </SelectItem>
                          ))}
                          
                          {/* 30 second intervals from 5m 30s to 15 minutes */}
                          {Array.from({ length: 19 }, (_, i) => 300 + (i + 1) * 30).map(seconds => (
                            <SelectItem key={seconds} value={seconds.toString()}>
                              {Math.floor(seconds / 60)}m {seconds % 60}s
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Exercise Options Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {exercise.supersetId ? (
                            <DropdownMenuItem onClick={() => removeFromSuperset(exerciseIndex)}>
                              Remove from Superset
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => openSupersetModal(exerciseIndex)}>
                                Create New Superset
                              </DropdownMenuItem>
                              {getSupersetsInUse().length > 0 && (
                                <>
                                  {getSupersetsInUse().map(supersetId => (
                                    <DropdownMenuItem 
                                      key={supersetId}
                                      onClick={() => addToSuperset(exerciseIndex, supersetId)}
                                    >
                                      Add to {supersetId}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        onClick={() => removeExerciseFromRoutine(exerciseIndex)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Exercise Notes */}
                  <div className="mb-4">
                    <Input
                      value={exercise.notes || ""}
                      onChange={(e) => {
                        const updatedExercises = [...selectedExercises];
                        updatedExercises[exerciseIndex].notes = e.target.value;
                        setSelectedExercises(updatedExercises);
                      }}
                      placeholder="Add exercise notes (e.g., slow tempo, pause at bottom)"
                      className="text-sm"
                    />
                  </div>

                  {/* Sets List */}
                  <div className="space-y-2">
                    {exercise.sets.map((set, setIndex) => (
                      <div 
                        key={setIndex}
                        className="flex items-center gap-4 p-3 border rounded-md bg-gray-50"
                      >
                        <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                          Set {setIndex + 1}
                        </span>
                        
                        {/* Weight and Reps Inputs */}
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Input
                              value={set.weight || ""}
                              onChange={(e) => updateSetField(exerciseIndex, setIndex, 'weight', e.target.value)}
                              placeholder="Weight"
                              type="number"
                              className="h-8 text-sm"
                            />
                            <span className="text-xs text-gray-500">Weight</span>
                          </div>
                          <div>
                            <Input
                              value={set.reps || ""}
                              onChange={(e) => updateSetField(exerciseIndex, setIndex, 'reps', e.target.value)}
                              placeholder="Reps"
                              type="number"
                              className="h-8 text-sm"
                            />
                            <span className="text-xs text-gray-500">Reps</span>
                          </div>
                        </div>

                        {/* RPE Input */}
                        {(() => {
                          const selectedExercise = exercises?.data?.find((ex: any) => ex.id === exercise.exerciseId);
                          const exerciseType = selectedExercise?.exerciseType || selectedExercise?.type || 'weight_reps';
                          return !['weight_distance', 'distance_duration'].includes(exerciseType);
                        })() && (
                          <div className="w-20">
                            <Input
                              value={set.rpe || ""}
                              onChange={(e) => updateSetField(exerciseIndex, setIndex, 'rpe', e.target.value)}
                              placeholder="8"
                              type="number"
                              min="1"
                              max="10"
                              className="h-8 text-sm"
                            />
                            <span className="text-xs text-gray-500">RPE</span>
                          </div>
                        )}

                        {/* Remove Set Button */}
                        {exercise.sets.length > 1 && (
                          <Button
                            onClick={() => removeSetFromExercise(exerciseIndex, setIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {/* Add Set Button */}
                    <Button
                      onClick={() => addSetToExercise(exerciseIndex)}
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Set
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No exercises added yet. Add some exercises to get started!
            </div>
          )}
        </div>

        {/* Exercise Search and Add Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Add Exercises</h3>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Exercise Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedMuscleGroup === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMuscleGroup('all')}
              >
                All
              </Button>
              {muscleGroups.map(group => (
                <Button
                  key={group}
                  variant={selectedMuscleGroup === group ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMuscleGroup(group)}
                >
                  {group}
                </Button>
              ))}
            </div>

            {/* Exercise List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredExercises?.data?.map((exercise: any) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div>
                    <h4 className="font-medium">{exercise.name}</h4>
                    <p className="text-sm text-gray-500">
                      {exercise.muscleGroups?.join(', ')}
                    </p>
                  </div>
                  <Button
                    onClick={() => addExerciseToRoutine(exercise)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Routine Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Save Routine</h3>
              <p className="text-sm text-gray-500">
                {selectedExercises.length} exercises added
              </p>
            </div>
            <Button 
              onClick={handleSaveRoutine}
              disabled={!routineName.trim() || selectedExercises.length === 0 || saveRoutineMutation.isPending}
              className="px-6"
            >
              {saveRoutineMutation.isPending ? "Saving..." : "Save Routine"}
            </Button>
          </div>
        </div>
      </div>

      {/* Superset Creation Modal */}
      <Dialog open={showSupersetModal} onOpenChange={setShowSupersetModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Superset</DialogTitle>
            <DialogDescription>
              Select other exercises to group with "{currentExerciseIndex !== null ? selectedExercises[currentExerciseIndex]?.exerciseName : ''}" in a superset.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {selectedExercises.map((exercise, index) => {
              if (index === currentExerciseIndex || exercise.supersetId) return null;
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`exercise-${index}`}
                    checked={selectedExercisesForSuperset.includes(index)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedExercisesForSuperset(prev => [...prev, index]);
                      } else {
                        setSelectedExercisesForSuperset(prev => 
                          prev.filter(i => i !== index)
                        );
                      }
                    }}
                  />
                  <label 
                    htmlFor={`exercise-${index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {exercise.exerciseName}
                  </label>
                </div>
              );
            })}
            
            {selectedExercises.filter((_, index) => 
              index !== currentExerciseIndex && !selectedExercises[index].supersetId
            ).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No other exercises available to group in a superset.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSupersetModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createSuperset}
              disabled={selectedExercisesForSuperset.length === 0}
            >
              Create Superset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}