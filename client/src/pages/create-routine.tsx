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
  Move,
  Replace,
  Scale,
  Link,
  Dumbbell,
  GripVertical
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

// Sortable Exercise Item Component
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
  updateSet
}: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exerciseIndex.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg bg-white border-l-4 transition-all duration-200 ${
        exercise.supersetId 
          ? getSupersetColor(exercise.supersetId)
          : 'border-l-gray-200'
      } ${
        groupingMode && !exercise.supersetId
          ? 'cursor-pointer hover:shadow-md hover:border-blue-300'
          : ''
      } ${
        selectedForGrouping.includes(exerciseIndex)
          ? 'ring-2 ring-blue-500 bg-blue-50'
          : ''
      }`}
      onClick={() => {
        if (groupingMode && !exercise.supersetId) {
          toggleExerciseSelection(exerciseIndex);
        }
      }}
    >
      {/* Exercise Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {groupingMode && !exercise.supersetId && (
                <div className="flex items-center">
                  <Checkbox
                    checked={selectedForGrouping.includes(exerciseIndex)}
                    readOnly
                    className="mr-2"
                  />
                </div>
              )}
              <div className="font-medium text-lg">{exercise.exerciseName}</div>
              {exercise.supersetId && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {exercise.supersetId}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {exercise.sets.length} sets • Rest: {(() => {
                const seconds = exercise.restDuration;
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
              })()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Superset controls */}
          {exercise.supersetId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                removeFromSuperset(exerciseIndex);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              Remove from {exercise.supersetId}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Link className="h-4 w-4 mr-1" />
                  Superset
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => openSupersetModal(exerciseIndex)}>
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              removeExercise(exerciseIndex);
            }}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Rest of exercise content will be added here */}
    </div>
  );
}

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
  const [restDuration, setRestDuration] = useState("120"); // 2 minutes default
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");

  // Superset management
  const [supersetCounter, setSupersetCounter] = useState(1);
  const [availableSupersets, setAvailableSupersets] = useState<string[]>([]);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  const [selectedExercisesForSuperset, setSelectedExercisesForSuperset] = useState<number[]>([]);
  const [groupingMode, setGroupingMode] = useState(false);
  const [selectedForGrouping, setSelectedForGrouping] = useState<number[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch exercises for the dropdown
  const { data: exercises = [] } = useQuery({
    queryKey: ["/api/exercises"],
  });

  const { data: folders = [] } = useQuery({
    queryKey: ["/api/routine-folders"],
  });

  // Fetch existing routine data when in edit mode
  const { data: existingRoutine } = useQuery({
    queryKey: [`/api/workout-templates/${editId}`],
    enabled: isEditMode && !!editId,
  });

  // Populate form fields when existing routine data is loaded
  useEffect(() => {
    if (existingRoutine && isEditMode) {
      setRoutineName(existingRoutine.name || "");
      setRoutineDescription(existingRoutine.description || "");
      setSelectedFolderId(existingRoutine.folderId?.toString() || "");
      
      // Load routine exercises if they exist
      if (existingRoutine.exercises && Array.isArray(existingRoutine.exercises)) {
        const routineExercises = existingRoutine.exercises.map((exercise: any) => {
          // Try to parse stored sets data from notes field
          let setsData = [];
          let userNotes = "";
          
          if (exercise.notes) {
            try {
              const parsedNotes = JSON.parse(exercise.notes);
              if (parsedNotes.setsData && Array.isArray(parsedNotes.setsData)) {
                setsData = parsedNotes.setsData;
              }
              userNotes = parsedNotes.userNotes || "";
            } catch (e) {
              // If parsing fails, treat notes as regular user notes
              userNotes = exercise.notes;
            }
          }
          
          // If no stored sets data, create default sets
          if (setsData.length === 0) {
            setsData = Array.from({ length: exercise.setsTarget || 3 }, () => ({
              reps: exercise.repsTarget || "10",
              weight: exercise.weightTarget || "",
            }));
          }
          
          return {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exercise.name,
            sets: setsData,
            restDuration: exercise.restDuration || 120,
            notes: userNotes,
          };
        });
        setSelectedExercises(routineExercises);
      }
    }
  }, [existingRoutine, isEditMode]);

  // Superset helper functions
  const generateSupersetId = () => {
    return `SS${supersetCounter}`;
  };

  const getSupersetsInUse = () => {
    const supersets = new Set<string>();
    selectedExercises.forEach(exercise => {
      if (exercise.supersetId) {
        supersets.add(exercise.supersetId);
      }
    });
    return Array.from(supersets);
  };

  const getSupersetColor = (supersetId: string) => {
    const colors = [
      'border-l-blue-500 bg-blue-50',
      'border-l-green-500 bg-green-50', 
      'border-l-purple-500 bg-purple-50',
      'border-l-orange-500 bg-orange-50',
      'border-l-pink-500 bg-pink-50',
      'border-l-cyan-500 bg-cyan-50',
      'border-l-yellow-500 bg-yellow-50',
      'border-l-red-500 bg-red-50'
    ];
    const supersets = getSupersetsInUse().sort();
    const index = supersets.indexOf(supersetId);
    return colors[index % colors.length] || 'border-l-gray-500 bg-gray-50';
  };

  const openSupersetModal = (exerciseIndex: number) => {
    setCurrentExerciseIndex(exerciseIndex);
    setSelectedExercisesForSuperset([]);
    setShowSupersetModal(true);
  };

  const createSuperset = () => {
    if (currentExerciseIndex === null) return;
    
    const newSupersetId = generateSupersetId();
    const exercisesToUpdate = [currentExerciseIndex, ...selectedExercisesForSuperset];
    
    setSelectedExercises(prev => 
      prev.map((exercise, index) => 
        exercisesToUpdate.includes(index)
          ? { ...exercise, supersetId: newSupersetId }
          : exercise
      )
    );

    setSupersetCounter(prev => prev + 1);
    setShowSupersetModal(false);
    setCurrentExerciseIndex(null);
    setSelectedExercisesForSuperset([]);
  };

  const addToSuperset = (exerciseIndex: number, supersetId?: string) => {
    const newSupersetId = supersetId || generateSupersetId();
    
    setSelectedExercises(prev => 
      prev.map((exercise, index) => 
        index === exerciseIndex 
          ? { ...exercise, supersetId: newSupersetId }
          : exercise
      )
    );

    if (!supersetId) {
      setSupersetCounter(prev => prev + 1);
    }
  };

  const removeFromSuperset = (exerciseIndex: number) => {
    setSelectedExercises(prev => 
      prev.map((exercise, index) => 
        index === exerciseIndex 
          ? { ...exercise, supersetId: undefined }
          : exercise
      )
    );
  };

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedExercises.findIndex((_, index) => index.toString() === active.id);
      const newIndex = selectedExercises.findIndex((_, index) => index.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setSelectedExercises((exercises) => {
          return arrayMove(exercises, oldIndex, newIndex);
        });
      }
    }
  };

  // One-click grouping functions
  const enterGroupingMode = () => {
    setGroupingMode(true);
    setSelectedForGrouping([]);
  };

  const exitGroupingMode = () => {
    setGroupingMode(false);
    setSelectedForGrouping([]);
  };

  const toggleExerciseSelection = (exerciseIndex: number) => {
    if (!groupingMode) return;
    
    setSelectedForGrouping(prev => {
      if (prev.includes(exerciseIndex)) {
        return prev.filter(i => i !== exerciseIndex);
      } else {
        return [...prev, exerciseIndex];
      }
    });
  };

  const createGroupFromSelection = () => {
    if (selectedForGrouping.length < 2) {
      toast({
        title: "Invalid Selection",
        description: "Please select at least 2 exercises to create a superset.",
        variant: "destructive"
      });
      return;
    }

    const newSupersetId = generateSupersetId();
    
    setSelectedExercises(prev => 
      prev.map((exercise, index) => 
        selectedForGrouping.includes(index)
          ? { ...exercise, supersetId: newSupersetId }
          : exercise
      )
    );

    setSupersetCounter(prev => prev + 1);
    exitGroupingMode();
    
    toast({
      title: "Superset Created!",
      description: `${selectedForGrouping.length} exercises grouped into ${newSupersetId}`,
    });
  };

  // Filter exercises based on search and filters
  const filteredExercises = exercises.filter((exercise: any) => {
    const matchesSearch = exerciseSearch === "" || 
      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (exercise.description && exercise.description.toLowerCase().includes(exerciseSearch.toLowerCase()));
    
    const matchesMuscleGroup = muscleGroupFilter === "" || muscleGroupFilter === "all" ||
      (exercise.primaryMuscleGroups && exercise.primaryMuscleGroups.includes(muscleGroupFilter)) ||
      (exercise.secondaryMuscleGroups && exercise.secondaryMuscleGroups.includes(muscleGroupFilter));
    
    const matchesEquipment = equipmentFilter === "" || equipmentFilter === "all" ||
      exercise.equipmentType === equipmentFilter;
    
    return matchesSearch && matchesMuscleGroup && matchesEquipment;
  });

  // Create/Update routine mutation
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
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-templates", editId] });
      queryClient.invalidateQueries({ queryKey: ["/api/routine-folders"] });
      
      toast({
        title: "Success!",
        description: `Your workout routine has been ${isEditMode ? 'updated' : 'created'}.`,
      });
      
      // Small delay to ensure cache invalidation completes before navigation
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

  const addExerciseToRoutine = () => {
    if (!selectedExerciseId) {
      toast({
        title: "Select Exercise",
        description: "Please select an exercise to add to your routine.",
        variant: "destructive",
      });
      return;
    }

    const exercise = exercises.find((ex: any) => ex.id === parseInt(selectedExerciseId));
    if (!exercise) return;

    const repsValue = useRepRange 
      ? (minReps === maxReps ? minReps : `${minReps}-${maxReps}`)
      : singleReps;
    
    const routineExercise: RoutineExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: Array.from({ length: parseInt(sets) }, () => ({
        reps: repsValue,
        weight: undefined, // Will be set later in the routine
        rpe: undefined, // Will be set later in the routine
      })),
      restDuration: parseInt(restDuration),
      notes: undefined, // Will be set later in the routine
    };

    setSelectedExercises([...selectedExercises, routineExercise]);
    setSelectedExerciseId("");
    setSets("3");
    setSingleReps("10");
    setMinReps("8");
    setMaxReps("12");
    setRestDuration("120"); // Reset to 2 minutes default
  };

  const removeExerciseFromRoutine = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateSetField = (exerciseIndex: number, setIndex: number, field: keyof RoutineSet, value: string | number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...updatedExercises[exerciseIndex].sets[setIndex],
      [field]: value
    };
    setSelectedExercises(updatedExercises);
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

  const updateExerciseRestTime = (exerciseIndex: number, restDuration: number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].restDuration = restDuration;
    setSelectedExercises(updatedExercises);
  };

  const handleCreateRoutine = () => {
    if (!routineName.trim()) {
      toast({
        title: "Routine Name Required",
        description: "Please enter a name for your routine.",
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

    // Transform exercises data for backend compatibility
    const exercisesForBackend = selectedExercises.map(exercise => {
      // Store individual sets data in notes field as JSON for now
      const setsData = exercise.sets.map(set => ({
        reps: set.reps,
        weight: set.weight || null,
        rpe: set.rpe || null
      }));
      
      const firstSet = exercise.sets[0];
      return {
        exerciseId: exercise.exerciseId,
        setsTarget: exercise.sets.length,
        repsTarget: parseInt(firstSet.reps) || 10,
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

  const goBack = () => {
    window.location.href = "/routines";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={goBack}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isEditMode ? 'Edit Routine' : 'Create New Routine'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditMode ? 'Update your workout routine by modifying exercises, sets and reps' : 'Build your custom workout routine by adding exercises with specific sets and reps'}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleCreateRoutine}
          disabled={saveRoutineMutation.isPending || selectedExercises.length === 0}
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
        >
          {saveRoutineMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditMode ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? 'Update Routine' : 'Save Routine'}
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Routine Details & Add Exercise */}
        <div className="lg:col-span-1 space-y-6">
          {/* Routine Details */}
          <Card>
            <CardHeader>
              <CardTitle>Routine Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="routineName">Routine Name *</Label>
                <Input
                  id="routineName"
                  placeholder="e.g., Push Day, Upper Body, Morning Workout"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="routineDescription">Description (Optional)</Label>
                <Textarea
                  id="routineDescription"
                  placeholder="Describe your routine..."
                  value={routineDescription}
                  onChange={(e) => setRoutineDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Folder (Optional)</Label>
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a folder or leave unorganized" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Folder (Unorganized)</SelectItem>
                    {Array.isArray(folders) && folders.map((folder: any) => (
                      <SelectItem key={folder.id} value={folder.id.toString()}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Add Exercise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find & Add Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Exercise</Label>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or description..."
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
                        <SelectItem value="biceps">Biceps</SelectItem>
                        <SelectItem value="triceps">Triceps</SelectItem>
                        <SelectItem value="legs">Legs</SelectItem>
                        <SelectItem value="glutes">Glutes</SelectItem>
                        <SelectItem value="calves">Calves</SelectItem>
                        <SelectItem value="abs">Abs</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
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
                        <SelectItem value="cable">Cable</SelectItem>
                        <SelectItem value="kettlebell">Kettlebell</SelectItem>
                        <SelectItem value="resistance_band">Resistance Band</SelectItem>
                        <SelectItem value="cardio_machine">Cardio Machine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Results Counter */}
                {(exerciseSearch || muscleGroupFilter || equipmentFilter) && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    <Filter className="inline h-4 w-4 mr-1" />
                    Found {filteredExercises.length} exercises
                    {exerciseSearch && ` matching "${exerciseSearch}"`}
                    {muscleGroupFilter && muscleGroupFilter !== "all" && ` for ${muscleGroupFilter}`}
                    {equipmentFilter && equipmentFilter !== "all" && ` using ${equipmentFilter}`}
                  </div>
                )}
                
                {/* Exercise List with Thumbnails */}
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {filteredExercises.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No exercises found with current filters
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredExercises.map((exercise: any, index: number) => (
                        <button
                          key={`${exercise.id}-${exercise.createdBy ? 'custom' : 'system'}-${index}`}
                          type="button"
                          onClick={() => setSelectedExerciseId(exercise.id.toString())}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-blue-50 ${
                            selectedExerciseId === exercise.id.toString() 
                              ? 'bg-blue-100 border-blue-300' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          {/* Exercise Thumbnail */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {exercise.imageUrl ? (
                              <img 
                                src={exercise.imageUrl} 
                                alt={exercise.name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling!.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`text-gray-400 text-xs ${exercise.imageUrl ? 'hidden' : ''}`}>
                              {exercise.equipmentType === 'bodyweight' ? '🏃' : 
                               exercise.equipmentType === 'barbell' ? '🏋️' :
                               exercise.equipmentType === 'dumbbell' ? '💪' : 
                               exercise.equipmentType === 'machine' ? '⚙️' : '🎯'}
                            </div>
                          </div>
                          
                          {/* Exercise Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {exercise.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {exercise.primaryMuscleGroups?.join(', ')} • {exercise.equipmentType}
                            </div>
                            {exercise.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                                {exercise.description}
                              </div>
                            )}
                          </div>
                          
                          {/* Selection Indicator */}
                          {selectedExerciseId === exercise.id.toString() && (
                            <div className="text-blue-600">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sets</Label>
                  <Input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    placeholder="3"
                    min="1"
                  />
                </div>
                {/* Only show rep configuration for exercises that use reps */}
                {(() => {
                  const selectedExercise = exercises?.find((ex: any) => ex.id === parseInt(selectedExerciseId || "0"));
                  const exerciseType = selectedExercise?.exerciseType || selectedExercise?.type || 'weight_reps';
                  const needsReps = ['weight_reps', 'bodyweight', 'assisted_bodyweight', 'weighted_bodyweight'].includes(exerciseType);
                  
                  return needsReps ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setUseRepRange(!useRepRange)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Label className="cursor-pointer">
                          {useRepRange ? "Rep Range" : "Reps"}
                        </Label>
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform duration-200 ${
                            useRepRange ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                      </button>
                      
                      {useRepRange ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="8"
                              value={minReps}
                              onChange={(e) => setMinReps(e.target.value)}
                              min="1"
                              className="flex-1"
                            />
                            <span className="text-gray-500 font-medium">-</span>
                            <Input
                              type="number"
                              placeholder="12"
                              value={maxReps}
                              onChange={(e) => setMaxReps(e.target.value)}
                              min="1"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-gray-500">Set minimum and maximum reps (e.g., 8-12)</p>
                        </>
                      ) : (
                        <>
                          <Input
                            type="number"
                            placeholder="10"
                            value={singleReps}
                            onChange={(e) => setSingleReps(e.target.value)}
                            min="1"
                          />
                          <p className="text-xs text-gray-500">Set exact number of reps</p>
                        </>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
              
              {/* Weight and notes will be set after adding to routine */}
              
              <div className="space-y-2">
                <Label>Rest Time Between Sets</Label>
                <Select value={restDuration} onValueChange={setRestDuration}>
                  <SelectTrigger>
                    <SelectValue>
                      {(() => {
                        const seconds = parseInt(restDuration || "120");
                        const mins = Math.floor(seconds / 60);
                        const secs = seconds % 60;
                        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
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
                <p className="text-xs text-gray-500">
                  Default: 2 minutes rest between sets
                </p>
              </div>
              
              <Button 
                onClick={addExerciseToRoutine}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Routine
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Routine Preview */}
        <div className="lg:col-span-2">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center justify-between flex-1">
                  <span>Routine Exercises ({selectedExercises.length})</span>
                  {selectedExercises.length > 0 && (
                    <span className="text-sm font-normal text-gray-600">
                      Total: {selectedExercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets
                    </span>
                  )}
                </CardTitle>
                {selectedExercises.length >= 2 && (
                  <div className="flex gap-2 ml-4">
                    {!groupingMode ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={enterGroupingMode}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        Group Exercises
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exitGroupingMode}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={createGroupFromSelection}
                          disabled={selectedForGrouping.length < 2}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Create Group ({selectedForGrouping.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {groupingMode && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  Click on exercises below to select them for grouping into a superset
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedExercises.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
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
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Dumbbell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p>No exercises added yet</p>
                  <p className="text-sm">Select exercises from the list below to build your routine</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Superset Creation Modal */}
          <Dialog open={showSupersetModal} onOpenChange={setShowSupersetModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Superset</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Creating superset for: {currentExerciseIndex !== null && selectedExercises[currentExerciseIndex]?.exerciseName}
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    Select other exercises to group with this one:
                  </p>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedExercises.map((exercise, index) => {
                      if (index === currentExerciseIndex || exercise.supersetId) return null;
                      
                      return (
                        <label key={index} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <Checkbox
                            checked={selectedExercisesForSuperset.includes(index)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedExercisesForSuperset(prev => [...prev, index]);
                              } else {
                                setSelectedExercisesForSuperset(prev => prev.filter(i => i !== index));
                              }
                            }}
                          />
                          <span className="text-sm">{exercise.exerciseName}</span>
                        </label>
                      );
                    })}
                  </div>
                  
                  {selectedExercises.filter((_, index) => index !== currentExerciseIndex && !selectedExercises[index].supersetId).length === 0 && (
                    <p className="text-sm text-gray-500 italic">No other exercises available for superset</p>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSupersetModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      createSuperset(selectedExercisesForSuperset);
                      setShowSupersetModal(false);
                    }}
                    disabled={selectedExercisesForSuperset.length === 0}
                  >
                    Create Superset
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Exercise Library */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Exercise Library</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search exercises..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Muscle Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      <SelectItem value="chest">Chest</SelectItem>
                      <SelectItem value="back">Back</SelectItem>
                      <SelectItem value="shoulders">Shoulders</SelectItem>
                      <SelectItem value="arms">Arms</SelectItem>
                      <SelectItem value="legs">Legs</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => addExerciseToRoutine(exercise)}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-medium">{exercise.name}</div>
                      <div className="text-sm text-gray-600">
                        {exercise.muscleGroups?.join(', ')} • {exercise.type}
                      </div>
                    </div>
                    <Plus className="h-5 w-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Routine Card */}
      <Card className="mt-6">
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
              disabled={!formData.name.trim() || selectedExercises.length === 0 || isCreating}
              className="min-w-[120px]"
            >
              {isCreating ? (
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
    </div>
  );
}