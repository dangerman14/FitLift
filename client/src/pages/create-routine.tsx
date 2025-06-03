import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OfflineManager } from "@/lib/offline";
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
  MoreVertical,
  Move,
  Replace,
  Check,
  Scale,
  Link,
  Dumbbell,
  GripVertical,
  Trash2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExerciseSetInput from "@/components/exercise-set-input";
import {
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RoutineSet {
  reps?: string;
  weight?: string;
  duration?: string;
  distance?: string;
  assistanceWeight?: string;
  rpe?: string;
}

interface RoutineExercise {
  exerciseId: number;
  exerciseName: string;
  sets: RoutineSet[];
  restDuration: number;
  notes?: string;
  supersetId?: string;
}

interface Exercise {
  id: number;
  name: string;
  muscleGroups?: string[];
  primaryMuscleGroups?: string[];
  type?: string;
  equipmentType?: string;
}

interface SortableExerciseItemProps {
  exercise: RoutineExercise;
  exerciseIndex: number;
  groupingMode: boolean;
  selectedForGrouping: number[];
  getSupersetColor: (supersetId: string) => string;
  toggleExerciseSelection: (index: number) => void;
  removeExercise: (index: number) => void;
  removeFromSuperset: (index: number) => void;
  openSupersetModal: (index: number) => void;
  addToSuperset: (index: number, supersetId?: string) => void;
  getSupersetsInUse: () => string[];
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, field: keyof RoutineSet, value: string) => void;
  isDraggingGlobal: boolean;
  exerciseWeightUnits: {[key: number]: string};
  setExerciseWeightUnits: React.Dispatch<React.SetStateAction<{[key: number]: string}>>;
  selectedExercises: RoutineExercise[];
  setSelectedExercises: React.Dispatch<React.SetStateAction<RoutineExercise[]>>;
  children: React.ReactNode;
}

function SortableExerciseItem({ 
  exercise, 
  exerciseIndex, 
  groupingMode, 
  selectedForGrouping,
  getSupersetColor,
  toggleExerciseSelection,
  removeExercise,
  removeFromSuperset,
  openSupersetModal,
  addToSuperset,
  getSupersetsInUse,
  addSet,
  removeSet,
  updateSet,
  isDraggingGlobal,
  exerciseWeightUnits,
  setExerciseWeightUnits,
  selectedExercises,
  setSelectedExercises,
  children
}: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: exerciseIndex.toString()});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 ${isDragging ? 'z-50' : 'z-0'}`}
      onClick={(e) => {
        if (groupingMode && !exercise.supersetId) {
          e.preventDefault();
          e.stopPropagation();
          toggleExerciseSelection(exerciseIndex);
        }
      }}
    >
      {/* Exercise Header */}
      <div className="p-3 border-b bg-gray-50">
        {/* First row: Drag bar, Title, Menu */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              {...attributes} 
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            {groupingMode && !exercise.supersetId && (
              <Checkbox
                checked={selectedForGrouping.includes(exerciseIndex)}
                onCheckedChange={() => {}}
                className="mr-2"
              />
            )}
            <div className="flex items-center gap-2">
              <div className="font-medium text-lg">{exercise.exerciseName}</div>
              {exercise.supersetId && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {exercise.supersetId}
                </span>
              )}
            </div>
          </div>
          
          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Superset options */}
              {exercise.supersetId ? (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromSuperset(exerciseIndex);
                  }}
                  className="text-red-600"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove from {exercise.supersetId}
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => {
                    console.log('Create New Superset clicked for exercise index:', exerciseIndex);
                    openSupersetModal(exerciseIndex);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Superset
                  </DropdownMenuItem>
                  {getSupersetsInUse().map((supersetId) => (
                    <DropdownMenuItem
                      key={supersetId}
                      onClick={() => addToSuperset(exerciseIndex, supersetId)}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Add to {supersetId}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              
              {/* Separator if superset options exist */}
              {(exercise.supersetId || getSupersetsInUse().length > 0) && (
                <div className="border-t my-1"></div>
              )}
              
              {/* Remove exercise */}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  removeExercise(exerciseIndex);
                }}
                className="text-red-600"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Exercise
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Second row: Rest Timer */}
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{exercise.sets.length} sets</span>
          <div className="flex items-center gap-1">
            <span>Rest:</span>
            <Select
              value={exercise.restDuration.toString()}
              onValueChange={(value) => {
                const newExercises = [...selectedExercises];
                newExercises[exerciseIndex].restDuration = parseInt(value);
                setSelectedExercises(newExercises);
              }}
            >
              <SelectTrigger className="w-20 h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1m</SelectItem>
                <SelectItem value="90">1m 30s</SelectItem>
                <SelectItem value="120">2m</SelectItem>
                <SelectItem value="150">2m 30s</SelectItem>
                <SelectItem value="180">3m</SelectItem>
                <SelectItem value="240">4m</SelectItem>
                <SelectItem value="300">5m</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {children}
    </div>
  );
}

export default function CreateRoutine() {
  // Check if we're in edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const isEditMode = !!editId;

  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [sets, setSets] = useState("3");
  const [useRepRange, setUseRepRange] = useState(true);
  const [singleReps, setSingleReps] = useState("10");
  const [minReps, setMinReps] = useState("8");
  const [maxReps, setMaxReps] = useState("12");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [restDuration, setRestDuration] = useState("120");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("all");

  // Superset management
  const [supersetCounter, setSupersetCounter] = useState(1);
  const [availableSupersets, setAvailableSupersets] = useState<string[]>([]);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  const [selectedExercisesForSuperset, setSelectedExercisesForSuperset] = useState<number[]>([]);
  const [groupingMode, setGroupingMode] = useState(false);
  const [selectedForGrouping, setSelectedForGrouping] = useState<number[]>([]);
  
  // Mobile exercise modal
  const [showMobileExerciseModal, setShowMobileExerciseModal] = useState(false);
  
  // Drag state for minimized view
  const [isDragging, setIsDragging] = useState(false);
  
  // Exercise weight unit preferences
  const [exerciseWeightUnits, setExerciseWeightUnits] = useState<{[key: number]: string}>({});
  
  // Ref for exercise list container
  const exerciseListRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Fetch exercises with proper typing
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
    queryFn: async () => {
      const offlineManager = OfflineManager.getInstance();
      
      try {
        const response = await fetch("/api/exercises");
        if (!response.ok) throw new Error("Failed to fetch exercises");
        const data = await response.json();
        
        // Cache exercises for offline use
        offlineManager.cacheExercises(data);
        return data;
      } catch (error) {
        // If offline, return cached exercises
        if (!offlineManager.getStatus()) {
          const cachedExercises = offlineManager.getCachedExercises();
          if (cachedExercises.length > 0) {
            return cachedExercises;
          }
        }
        throw error;
      }
    },
  });

  const { data: folders = [] } = useQuery<any[]>({
    queryKey: ["/api/routine-folders"],
  });

  // Fetch existing routine data when in edit mode
  const { data: existingRoutine } = useQuery({
    queryKey: [`/api/workout-templates/${editId}`],
    enabled: isEditMode && !!editId,
  });

  // Basic functionality
  const addExerciseToRoutine = (exerciseParam?: Exercise) => {
    let exercise: Exercise | undefined;
    
    if (exerciseParam) {
      exercise = exerciseParam;
    } else {
      if (!selectedExerciseId) {
        toast({
          title: "Select Exercise",
          description: "Please select an exercise to add to your routine.",
          variant: "destructive",
        });
        return;
      }
      exercise = exercises.find((ex) => ex.id === parseInt(selectedExerciseId));
    }
    
    if (!exercise) {
      toast({
        title: "Error",
        description: "Exercise data not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Check if exercise is already in routine
    if (selectedExercises.some(ex => ex.exerciseId === exercise!.id)) {
      toast({
        title: "Exercise Already Added",
        description: `${exercise.name} is already in your routine.`,
        variant: "destructive",
      });
      return;
    }

    const repsValue = useRepRange ? `${minReps}-${maxReps}` : singleReps;
    const setsCount = parseInt(sets) || 3;
    
    const newExercise: RoutineExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: Array.from({ length: setsCount }, () => ({
        reps: repsValue,
        weight: weight || "",
        rpe: "",
      })),
      restDuration: parseInt(restDuration) || 120,
      notes: notes || "",
    };

    setSelectedExercises([...selectedExercises, newExercise]);
    
    // Reset form
    setSelectedExerciseId("");
    setWeight("");
    setNotes("");
    
    toast({
      title: "Exercise Added",
      description: `${exercise.name} has been added to your routine.`,
    });
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...selectedExercises];
    const lastSet = updatedExercises[exerciseIndex].sets[updatedExercises[exerciseIndex].sets.length - 1];
    updatedExercises[exerciseIndex].sets.push({
      reps: lastSet.reps,
      weight: lastSet.weight,
      rpe: lastSet.rpe,
    });
    setSelectedExercises(updatedExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    setSelectedExercises(updatedExercises);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof RoutineSet, value: string) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...updatedExercises[exerciseIndex].sets[setIndex],
      [field]: value
    };
    setSelectedExercises(updatedExercises);
  };

  // Superset functions
  const getSupersetColor = (supersetId: string) => {
    const colors = ['border-l-blue-500', 'border-l-green-500', 'border-l-purple-500', 'border-l-orange-500'];
    const index = parseInt(supersetId.replace('SS', '')) - 1;
    return colors[index % colors.length];
  };

  const toggleExerciseSelection = (index: number) => {
    if (selectedForGrouping.includes(index)) {
      setSelectedForGrouping(selectedForGrouping.filter(i => i !== index));
    } else {
      setSelectedForGrouping([...selectedForGrouping, index]);
    }
  };

  const removeFromSuperset = (index: number) => {
    const updatedExercises = [...selectedExercises];
    delete updatedExercises[index].supersetId;
    setSelectedExercises(updatedExercises);
  };

  const openSupersetModal = (index: number) => {
    setCurrentExerciseIndex(index);
    setShowSupersetModal(true);
  };

  const addToSuperset = (index: number, supersetId?: string) => {
    const updatedExercises = [...selectedExercises];
    if (supersetId) {
      updatedExercises[index].supersetId = supersetId;
    } else {
      const newSupersetId = `SS${supersetCounter}`;
      updatedExercises[index].supersetId = newSupersetId;
      setSupersetCounter(supersetCounter + 1);
    }
    setSelectedExercises(updatedExercises);
  };

  const getSupersetsInUse = () => {
    const supersets = selectedExercises
      .map(ex => ex.supersetId)
      .filter(Boolean) as string[];
    return [...new Set(supersets)];
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id as string);
      const newIndex = parseInt(over.id as string);
      
      setSelectedExercises((exercises) => {
        return arrayMove(exercises, oldIndex, newIndex);
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
  };

  // Filter exercises
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = !exerciseSearch || 
      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    
    const matchesMuscleGroup = muscleGroupFilter === "" || muscleGroupFilter === "all" ||
      exercise.muscleGroups?.some(mg => mg.toLowerCase().includes(muscleGroupFilter.toLowerCase())) ||
      exercise.primaryMuscleGroups?.some(mg => mg.toLowerCase().includes(muscleGroupFilter.toLowerCase()));
    
    const matchesEquipment = equipmentFilter === "" || equipmentFilter === "all" ||
      exercise.equipmentType?.toLowerCase().includes(equipmentFilter.toLowerCase());

    return matchesSearch && matchesMuscleGroup && matchesEquipment;
  });

  // Save routine
  const saveRoutineMutation = useMutation({
    mutationFn: async (routineData: any) => {
      try {
        if (isEditMode && editId) {
          const response = await apiRequest("PUT", `/api/workout-templates/${editId}`, routineData);
          return response;
        } else {
          const response = await apiRequest("POST", "/api/workout-templates", routineData);
          return response;
        }
      } catch (error) {
        console.error("Mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", editId] });
      queryClient.invalidateQueries({ queryKey: ["/api/routine-folders"] });
      
      toast({
        title: "Success!",
        description: `Your workout routine has been ${isEditMode ? 'updated' : 'created'}.`,
      });
      
      setTimeout(() => {
        window.location.href = "/routines";
      }, 100);
    },
    onError: (error) => {
      console.error("Save routine error:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} routine. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleSaveRoutine = () => {
    if (!routineName.trim()) {
      toast({
        title: "Routine Name Required",
        description: "Please enter a name for your routine before saving.",
        variant: "destructive",
      });
      return;
    }

    if (selectedExercises.length === 0) {
      toast({
        title: "Add Exercises",
        description: "Please add at least one exercise to your routine.",
        variant: "destructive",
      });
      return;
    }

    const exercisesForBackend = selectedExercises.map(exercise => {
      const setsData = exercise.sets.map(set => ({
        reps: set.reps,
        weight: set.weight || null,
        rpe: set.rpe || null
      }));
      
      const firstSet = exercise.sets[0];
      return {
        exerciseId: exercise.exerciseId,
        setsTarget: exercise.sets.length,
        repsTarget: parseInt(firstSet.reps || "10") || 10,
        weightTarget: firstSet.weight ? parseFloat(firstSet.weight) : null,
        restDuration: exercise.restDuration,
        notes: JSON.stringify({
          userNotes: exercise.notes || null,
          setsData: setsData
        }),
      };
    });

    const routineData = {
      name: routineName,
      description: routineDescription,
      folderId: selectedFolderId && selectedFolderId !== "none" ? parseInt(selectedFolderId) : null,
      exercises: exercisesForBackend,
    };

    saveRoutineMutation.mutate(routineData);
  };

  const estimatedDuration = selectedExercises.reduce((total, exercise) => {
    const setTime = 2; // 2 minutes per set (including rest)
    return total + (exercise.sets.length * setTime);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.location.href = "/routines"}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Routines
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Routine" : "Create New Routine"}
        </h1>
      </div>

      {/* Routine Details */}
      <Card>
        <CardHeader>
          <CardTitle>Routine Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="routine-name">Routine Name *</Label>
            <Input
              id="routine-name"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="Enter routine name..."
            />
          </div>
          <div>
            <Label htmlFor="routine-description">Description</Label>
            <Textarea
              id="routine-description"
              value={routineDescription}
              onChange={(e) => setRoutineDescription(e.target.value)}
              placeholder="Enter routine description..."
            />
          </div>
          {folders.length > 0 && (
            <div>
              <Label htmlFor="folder">Folder</Label>
              <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Folder</SelectItem>
                  {folders.map((folder: any) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Exercise Button */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={() => setShowMobileExerciseModal(true)}
            className="w-full"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Exercise
          </Button>
        </CardContent>
      </Card>

      {/* Exercise List */}
      {selectedExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exercises ({selectedExercises.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={selectedExercises.map((_, index) => index.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {selectedExercises.map((exercise, exerciseIndex) => (
                    <SortableExerciseItem
                      key={`${exercise.exerciseId}-${exerciseIndex}`}
                      exercise={exercise}
                      exerciseIndex={exerciseIndex}
                      groupingMode={groupingMode}
                      selectedForGrouping={selectedForGrouping}
                      getSupersetColor={getSupersetColor}
                      toggleExerciseSelection={toggleExerciseSelection}
                      removeExercise={removeExercise}
                      removeFromSuperset={removeFromSuperset}
                      openSupersetModal={openSupersetModal}
                      addToSuperset={addToSuperset}
                      getSupersetsInUse={getSupersetsInUse}
                      addSet={addSet}
                      removeSet={removeSet}
                      updateSet={updateSet}
                      isDraggingGlobal={isDragging}
                      exerciseWeightUnits={exerciseWeightUnits}
                      setExerciseWeightUnits={setExerciseWeightUnits}
                      selectedExercises={selectedExercises}
                      setSelectedExercises={setSelectedExercises}
                    >
                      {/* Exercise content */}
                      <div className="p-4">
                        <div className="mb-3">
                          <h4 className="font-medium">Sets</h4>
                        </div>
                        
                        {/* Set Rows */}
                        {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex} className="grid grid-cols-5 gap-2 py-2 px-3 bg-white border rounded mb-2">
                            <div className="flex items-center justify-center">
                              <span className="text-sm font-medium">#{setIndex + 1}</span>
                            </div>
                            <div className="flex items-center">
                              <Input
                                type="text"
                                placeholder="Weight"
                                value={set.weight || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                                className="h-8 text-center text-sm"
                              />
                            </div>
                            <div className="flex items-center">
                              <Input
                                type="text"
                                placeholder="Reps"
                                value={set.reps || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                                className="h-8 text-center text-sm"
                              />
                            </div>
                            <div className="flex items-center">
                              <Input
                                type="text"
                                placeholder="RPE"
                                value={set.rpe || ""}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', e.target.value)}
                                className="h-8 text-center text-sm"
                              />
                            </div>
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSet(exerciseIndex, setIndex)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Add Set Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSet(exerciseIndex)}
                          className="w-full h-8 text-sm mt-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Set
                        </Button>
                      </div>
                    </SortableExerciseItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Save Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ready to save your routine?</h3>
              <p className="text-sm text-gray-600">
                {selectedExercises.length} exercises • Estimated {estimatedDuration} minutes
              </p>
            </div>
            <Button 
              onClick={handleSaveRoutine}
              disabled={saveRoutineMutation.isPending}
              className="min-w-[120px]"
            >
              {saveRoutineMutation.isPending ? (
                <>Creating...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Routine
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Exercise Modal */}
      <Dialog open={showMobileExerciseModal} onOpenChange={setShowMobileExerciseModal}>
        <DialogContent className="sm:max-w-md md:max-w-md w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find & Add Exercise
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden p-6 flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search exercises..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Muscle Group</Label>
                <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Any muscle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Muscle Groups</SelectItem>
                    <SelectItem value="chest">Chest</SelectItem>
                    <SelectItem value="back">Back</SelectItem>
                    <SelectItem value="shoulders">Shoulders</SelectItem>
                    <SelectItem value="arms">Arms</SelectItem>
                    <SelectItem value="legs">Legs</SelectItem>
                    <SelectItem value="core">Core</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Equipment</Label>
                <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Any equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Equipment</SelectItem>
                    <SelectItem value="bodyweight">Bodyweight</SelectItem>
                    <SelectItem value="barbell">Barbell</SelectItem>
                    <SelectItem value="dumbbell">Dumbbell</SelectItem>
                    <SelectItem value="machine">Machine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exercise List */}
            <div ref={exerciseListRef} className="space-y-2 flex-1 overflow-y-auto border rounded-lg p-2 bg-gray-50">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    addExerciseToRoutine(exercise);
                    setShowMobileExerciseModal(false);
                  }}
                  className="w-full text-left p-3 border rounded-lg transition-colors flex items-center justify-between bg-white border-gray-200 hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-sm text-gray-600">
                      {exercise.primaryMuscleGroups?.join(', ') || exercise.muscleGroups?.join(', ')} • {exercise.equipmentType || exercise.type}
                    </div>
                  </div>
                  <Plus className="h-5 w-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}