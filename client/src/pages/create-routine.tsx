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
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
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
                    onCheckedChange={() => {}}
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
                    {/* <1m in 5 second increments */}
                    <SelectItem value="5">5s</SelectItem>
                    <SelectItem value="10">10s</SelectItem>
                    <SelectItem value="15">15s</SelectItem>
                    <SelectItem value="20">20s</SelectItem>
                    <SelectItem value="25">25s</SelectItem>
                    <SelectItem value="30">30s</SelectItem>
                    <SelectItem value="35">35s</SelectItem>
                    <SelectItem value="40">40s</SelectItem>
                    <SelectItem value="45">45s</SelectItem>
                    <SelectItem value="50">50s</SelectItem>
                    <SelectItem value="55">55s</SelectItem>
                    
                    {/* <5min in 15 second intervals */}
                    <SelectItem value="60">1m</SelectItem>
                    <SelectItem value="75">1m 15s</SelectItem>
                    <SelectItem value="90">1m 30s</SelectItem>
                    <SelectItem value="105">1m 45s</SelectItem>
                    <SelectItem value="120">2m</SelectItem>
                    <SelectItem value="135">2m 15s</SelectItem>
                    <SelectItem value="150">2m 30s</SelectItem>
                    <SelectItem value="165">2m 45s</SelectItem>
                    <SelectItem value="180">3m</SelectItem>
                    <SelectItem value="195">3m 15s</SelectItem>
                    <SelectItem value="210">3m 30s</SelectItem>
                    <SelectItem value="225">3m 45s</SelectItem>
                    <SelectItem value="240">4m</SelectItem>
                    <SelectItem value="255">4m 15s</SelectItem>
                    <SelectItem value="270">4m 30s</SelectItem>
                    <SelectItem value="285">4m 45s</SelectItem>
                    
                    {/* Up to 15min in 30 second intervals */}
                    <SelectItem value="300">5m</SelectItem>
                    <SelectItem value="330">5m 30s</SelectItem>
                    <SelectItem value="360">6m</SelectItem>
                    <SelectItem value="390">6m 30s</SelectItem>
                    <SelectItem value="420">7m</SelectItem>
                    <SelectItem value="450">7m 30s</SelectItem>
                    <SelectItem value="480">8m</SelectItem>
                    <SelectItem value="510">8m 30s</SelectItem>
                    <SelectItem value="540">9m</SelectItem>
                    <SelectItem value="570">9m 30s</SelectItem>
                    <SelectItem value="600">10m</SelectItem>
                    <SelectItem value="630">10m 30s</SelectItem>
                    <SelectItem value="660">11m</SelectItem>
                    <SelectItem value="690">11m 30s</SelectItem>
                    <SelectItem value="720">12m</SelectItem>
                    <SelectItem value="750">12m 30s</SelectItem>
                    <SelectItem value="780">13m</SelectItem>
                    <SelectItem value="810">13m 30s</SelectItem>
                    <SelectItem value="840">14m</SelectItem>
                    <SelectItem value="870">14m 30s</SelectItem>
                    <SelectItem value="900">15m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
      
      {/* Sets */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Sets</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addSet(exerciseIndex)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
        </div>
        
        {exercise.sets.map((set, setIndex) => (
          <div key={setIndex} className="flex items-center gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <span className="text-sm font-medium min-w-[2rem]">#{setIndex + 1}</span>
            
            {/* Weight input */}
            <div className="flex-1">
              <Label className="text-xs">Weight</Label>
              <Input
                type="text"
                placeholder="Weight"
                value={set.weight || ""}
                onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                className="h-8"
              />
            </div>
            
            {/* Reps input */}
            <div className="flex-1">
              <Label className="text-xs">Reps</Label>
              <Input
                type="text"
                placeholder="Reps"
                value={set.reps || ""}
                onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                className="h-8"
              />
            </div>
            
            {/* Duration input for time-based exercises */}
            {set.duration !== undefined && (
              <div className="flex-1">
                <Label className="text-xs">Duration</Label>
                <Input
                  type="text"
                  placeholder="Duration"
                  value={set.duration || ""}
                  onChange={(e) => updateSet(exerciseIndex, setIndex, 'duration', e.target.value)}
                  className="h-8"
                />
              </div>
            )}
            
            {/* Distance input for distance-based exercises */}
            {set.distance !== undefined && (
              <div className="flex-1">
                <Label className="text-xs">Distance</Label>
                <Input
                  type="text"
                  placeholder="Distance"
                  value={set.distance || ""}
                  onChange={(e) => updateSet(exerciseIndex, setIndex, 'distance', e.target.value)}
                  className="h-8"
                />
              </div>
            )}
            
            {/* Assistance weight for bodyweight exercises */}
            {set.assistanceWeight !== undefined && (
              <div className="flex-1">
                <Label className="text-xs">Assistance</Label>
                <Input
                  type="text"
                  placeholder="Assistance"
                  value={set.assistanceWeight || ""}
                  onChange={(e) => updateSet(exerciseIndex, setIndex, 'assistanceWeight', e.target.value)}
                  className="h-8"
                />
              </div>
            )}
            
            {/* RPE input */}
            <div className="w-16">
              <Label className="text-xs">RPE</Label>
              <Input
                type="text"
                placeholder="RPE"
                value={set.rpe || ""}
                onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', e.target.value)}
                className="h-8"
              />
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeSet(exerciseIndex, setIndex)}
              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        
        {/* Notes */}
        <div className="mt-4">
          <Label className="text-sm font-medium">Notes</Label>
          <Textarea
            value={exercise.notes || ""}
            onChange={(e) => {
              const newExercises = [...selectedExercises];
              newExercises[exerciseIndex].notes = e.target.value;
              setSelectedExercises(newExercises);
            }}
            placeholder="Add any notes for this exercise..."
            className="mt-1"
            rows={2}
          />
        </div>
      </div>
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
    const matchesSearch = searchQuery === "" || 
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exercise.description && exercise.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesMuscleGroup = selectedMuscleGroup === "all" ||
      (exercise.muscleGroups && exercise.muscleGroups.includes(selectedMuscleGroup));
    
    return matchesSearch && matchesMuscleGroup;
  });

  // Calculate estimated duration
  const estimatedDuration = selectedExercises.reduce((total, exercise) => {
    const setsTime = exercise.sets.length * 45; // 45 seconds per set
    const restTime = (exercise.sets.length - 1) * (exercise.restDuration || 120); // Rest between sets
    return total + setsTime + restTime;
  }, 0) / 60; // Convert to minutes

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
        weight: "",
        duration: exercise.exerciseType === 'duration' ? "" : undefined,
        distance: exercise.exerciseType === 'distance' ? "" : undefined,
        assistanceWeight: exercise.exerciseType === 'bodyweight' ? "" : undefined,
        rpe: "",
      })),
      restDuration: parseInt(restDuration),
      notes: "",
    };

    setSelectedExercises([...selectedExercises, routineExercise]);
    setSelectedExerciseId("");
    setSets("3");
    setSingleReps("10");
    setMinReps("8");
    setMaxReps("12");
    setRestDuration("120"); // Reset to 2 minutes default
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof RoutineSet, value: string) => {
    updateSetField(exerciseIndex, setIndex, field, value);
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

  // Form data object
  const formData = {
    name: routineName,
    description: routineDescription,
  };

  // Handle save routine
  const handleSaveRoutine = handleCreateRoutine;
  const isCreating = saveRoutineMutation.isPending;

  const goBack = () => {
    window.location.href = "/routines";
  };

  const [showExerciseModal, setShowExerciseModal] = useState(false);

  return (
    <div className="space-y-4 p-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={goBack}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button 
          onClick={handleCreateRoutine}
          disabled={saveRoutineMutation.isPending || selectedExercises.length === 0}
          size="sm"
        >
          {saveRoutineMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditMode ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Routine Title and Folder */}
      <div className="space-y-3">
        <Input
          placeholder="Routine Title"
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
          className="text-lg font-medium"
        />
        
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

      {/* Add Exercise Button */}
      <Button 
        onClick={() => setShowExerciseModal(true)}
        className="w-full"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Exercise
      </Button>

      {/* Exercise Selection Modal */}
      <Dialog open={showExerciseModal} onOpenChange={setShowExerciseModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Find & Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                    <SelectItem value="barbell">Barbell</SelectItem>
                    <SelectItem value="dumbbell">Dumbbell</SelectItem>
                    <SelectItem value="machine">Machine</SelectItem>
                    <SelectItem value="bodyweight">Bodyweight</SelectItem>
                    <SelectItem value="cable">Cable</SelectItem>
                    <SelectItem value="kettlebell">Kettlebell</SelectItem>
                    <SelectItem value="resistance_band">Resistance Band</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Exercise List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    addExerciseToRoutine(exercise);
                    setShowExerciseModal(false);
                  }}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-2"
                >
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-sm text-gray-600">
                    {exercise.muscleGroups?.join(', ')} • {exercise.type}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selected Exercises List */}
      {selectedExercises.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-600 border-b pb-2">
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} added
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selectedExercises.map((_, index) => `exercise-${index}`)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {selectedExercises.map((exercise, exerciseIndex) => (
                  <SortableExerciseItem
                    key={`exercise-${exerciseIndex}`}
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
                  >
                    <div />
                  </SortableExerciseItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Empty State */}
      {selectedExercises.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No exercises added yet</div>
          <div className="text-xs mt-1">Tap "Add Exercise" to get started</div>
        </div>
      )}
      
      {/* Superset Modal */}
      <Dialog open={showSupersetModal} onOpenChange={setShowSupersetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Superset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select exercises to group into a superset:
            </p>
            
            <div className="space-y-2">
              {selectedExercises.map((exercise, index) => {
                if (index === currentExerciseIndex || exercise.supersetId) {
                  return null;
                }
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
