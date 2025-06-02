import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, GripVertical, X, Trash2, Users, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  updateSet, 
  children 
}: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: exerciseIndex.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const supersetColor = exercise.supersetId ? getSupersetColor(exercise.supersetId) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative border rounded-lg p-4 bg-white ${
        groupingMode ? 'cursor-pointer hover:bg-gray-50' : ''
      } ${
        selectedForGrouping.includes(exerciseIndex) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      } ${
        supersetColor ? `border-l-4` : ''
      }`}
      style={{
        ...style,
        ...(supersetColor && { borderLeftColor: supersetColor })
      }}
      onClick={groupingMode ? () => toggleExerciseSelection(exerciseIndex) : undefined}
    >
      {children}
      
      {/* Drag Handle */}
      {!groupingMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-4 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Exercise Header */}
      <div className="flex items-start justify-between mb-4 ml-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{exercise.exerciseName}</h3>
            {exercise.supersetId && (
              <span
                className="px-2 py-1 text-xs rounded-full text-white font-medium"
                style={{ backgroundColor: supersetColor || '#6B7280' }}
              >
                Superset
              </span>
            )}
          </div>
          
          {/* Rest Duration */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <Select
              value={exercise.restDuration.toString()}
              onValueChange={(value) => updateSet(exerciseIndex, 0, 'reps', value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue>
                  {(() => {
                    const seconds = exercise.restDuration;
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
          </div>
        </div>

        {/* Exercise Actions */}
        {!groupingMode && (
          <div className="flex items-center gap-2">
            {exercise.supersetId ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeFromSuperset(exerciseIndex)}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <Users className="h-4 w-4 mr-1" />
                Remove from Superset
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSupersetModal(exerciseIndex)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Users className="h-4 w-4 mr-1" />
                Add to Superset
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeExercise(exerciseIndex)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Sets */}
      <div className="space-y-2 mb-4">
        <div className="text-sm font-medium text-gray-700">Sets</div>
        {exercise.sets.map((set, setIndex) => (
          <div key={setIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium text-gray-600 w-8">
              {setIndex + 1}
            </span>
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div>
                <Input
                  placeholder="Reps"
                  value={set.reps || ''}
                  onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                  className="h-8"
                />
              </div>
              <div>
                <Input
                  placeholder="Weight"
                  value={set.weight || ''}
                  onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                  className="h-8"
                />
              </div>
              <div>
                <Input
                  placeholder="RPE"
                  value={set.rpe || ''}
                  onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSet(exerciseIndex, setIndex)}
              className="text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => addSet(exerciseIndex)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Set
        </Button>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor={`notes-${exerciseIndex}`} className="text-sm">Notes</Label>
        <Input
          id={`notes-${exerciseIndex}`}
          placeholder="Add notes for this exercise..."
          value={exercise.notes || ''}
          onChange={(e) => updateSet(exerciseIndex, 0, 'reps', e.target.value)}
          className="mt-1"
        />
      </div>
    </div>
  );
}

export default function CreateRoutine() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [routineName, setRoutineName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);

  // Modal state
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSupersetModal, setShowSupersetModal] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  const [selectedExercisesForSuperset, setSelectedExercisesForSuperset] = useState<number[]>([]);

  // Exercise selection state
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  // Exercise configuration
  const [sets, setSets] = useState("3");
  const [useRepRange, setUseRepRange] = useState(false);
  const [minReps, setMinReps] = useState("");
  const [maxReps, setMaxReps] = useState("");
  const [singleReps, setSingleReps] = useState("");
  const [restDuration, setRestDuration] = useState("120");

  // Grouping state
  const [groupingMode, setGroupingMode] = useState(false);
  const [selectedForGrouping, setSelectedForGrouping] = useState<number[]>([]);

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries
  const { data: exercises } = useQuery({
    queryKey: ['/api/exercises'],
  });

  const { data: folders } = useQuery({
    queryKey: ['/api/routine-folders'],
  });

  // Mutations
  const createRoutineMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/routines', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routines'] });
      toast({ title: "Routine created successfully!" });
      setLocation('/routines');
    },
    onError: () => {
      toast({ title: "Failed to create routine", variant: "destructive" });
    },
  });

  // Filter exercises
  const filteredExercises = exercises?.filter((exercise: any) => {
    const matchesSearch = !exerciseSearch || 
      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      exercise.description?.toLowerCase().includes(exerciseSearch.toLowerCase());
    
    const matchesMuscleGroup = muscleGroupFilter === "all" || 
      exercise.primaryMuscleGroups?.some((group: string) => 
        group.toLowerCase() === muscleGroupFilter.toLowerCase()
      );
    
    const matchesEquipment = equipmentFilter === "all" || 
      exercise.equipmentType?.toLowerCase() === equipmentFilter.toLowerCase();
    
    return matchesSearch && matchesMuscleGroup && matchesEquipment;
  }) || [];

  // Superset management
  const getSupersetColor = (supersetId: string) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];
    const index = parseInt(supersetId.slice(-1)) % colors.length;
    return colors[index];
  };

  const getSupersetsInUse = () => {
    return [...new Set(selectedExercises.map(ex => ex.supersetId).filter(Boolean))] as string[];
  };

  // Event handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setSelectedExercises((items) => {
        const oldIndex = parseInt(active.id.toString());
        const newIndex = parseInt(over!.id.toString());
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addExerciseToRoutine = () => {
    if (!selectedExerciseId) return;
    
    const exercise = exercises?.find((ex: any) => ex.id === parseInt(selectedExerciseId));
    if (!exercise) return;

    const routineExercise: RoutineExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: Array.from({ length: parseInt(sets) }, () => ({
        reps: useRepRange ? `${minReps}-${maxReps}` : singleReps,
        weight: '',
        rpe: ''
      })),
      restDuration: parseInt(restDuration),
      notes: ''
    };

    setSelectedExercises(prev => [...prev, routineExercise]);
    setShowExerciseModal(false);
    setSelectedExerciseId("");
    setSets("3");
    setMinReps("");
    setMaxReps("");
    setSingleReps("");
    setRestDuration("120");
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const addSet = (exerciseIndex: number) => {
    setSelectedExercises(prev => prev.map((exercise, index) => 
      index === exerciseIndex 
        ? { ...exercise, sets: [...exercise.sets, { reps: '', weight: '', rpe: '' }] }
        : exercise
    ));
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setSelectedExercises(prev => prev.map((exercise, index) => 
      index === exerciseIndex 
        ? { ...exercise, sets: exercise.sets.filter((_, i) => i !== setIndex) }
        : exercise
    ));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof RoutineSet, value: string) => {
    setSelectedExercises(prev => prev.map((exercise, index) => 
      index === exerciseIndex 
        ? {
            ...exercise,
            sets: exercise.sets.map((set, i) => 
              i === setIndex ? { ...set, [field]: value } : set
            )
          }
        : exercise
    ));
  };

  // Grouping handlers
  const enterGroupingMode = () => {
    setGroupingMode(true);
    setSelectedForGrouping([]);
  };

  const exitGroupingMode = () => {
    setGroupingMode(false);
    setSelectedForGrouping([]);
  };

  const toggleExerciseSelection = (index: number) => {
    setSelectedForGrouping(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const createGroupFromSelection = () => {
    if (selectedForGrouping.length < 2) return;
    
    const supersetId = `superset-${Date.now()}`;
    setSelectedExercises(prev => prev.map((exercise, index) => 
      selectedForGrouping.includes(index) 
        ? { ...exercise, supersetId }
        : exercise
    ));
    exitGroupingMode();
  };

  const openSupersetModal = (index: number) => {
    setCurrentExerciseIndex(index);
    setSelectedExercisesForSuperset([]);
    setShowSupersetModal(true);
  };

  const createSuperset = (exerciseIndices: number[]) => {
    if (currentExerciseIndex === null || exerciseIndices.length === 0) return;
    
    const supersetId = `superset-${Date.now()}`;
    const allIndices = [currentExerciseIndex, ...exerciseIndices];
    
    setSelectedExercises(prev => prev.map((exercise, index) => 
      allIndices.includes(index) 
        ? { ...exercise, supersetId }
        : exercise
    ));
  };

  const removeFromSuperset = (index: number) => {
    setSelectedExercises(prev => prev.map((exercise, i) => 
      i === index ? { ...exercise, supersetId: undefined } : exercise
    ));
  };

  const addToSuperset = (index: number, supersetId?: string) => {
    if (!supersetId) return;
    setSelectedExercises(prev => prev.map((exercise, i) => 
      i === index ? { ...exercise, supersetId } : exercise
    ));
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      toast({ title: "Please enter a routine name", variant: "destructive" });
      return;
    }

    if (selectedExercises.length === 0) {
      toast({ title: "Please add at least one exercise", variant: "destructive" });
      return;
    }

    const routineData = {
      name: routineName,
      folderId: selectedFolderId === "none" ? null : parseInt(selectedFolderId) || null,
      exercises: selectedExercises.map((exercise, index) => ({
        exerciseId: exercise.exerciseId,
        orderIndex: index,
        sets: exercise.sets,
        restDuration: exercise.restDuration,
        notes: exercise.notes,
        supersetId: exercise.supersetId,
      }))
    };

    createRoutineMutation.mutate(routineData);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto p-4">
      {/* Routine Title */}
      <div className="space-y-2">
        <Input
          placeholder="Enter routine name"
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
          className="text-lg font-medium"
        />
      </div>

      {/* Folder Selection */}
      <div className="space-y-2">
        <Label>Folder</Label>
        <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
          <SelectTrigger>
            <SelectValue placeholder="Select folder" />
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



      {/* Exercise Selection Modal */}
      <Dialog open={showExerciseModal} onOpenChange={setShowExerciseModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] w-full overflow-y-auto">
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
            
            {/* Exercise List */}
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
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {exercise.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {exercise.muscleGroups?.join(', ')} • {exercise.type}
                        </div>
                      </div>
                      
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
              <div className="space-y-2">
                <Label>Rest Time</Label>
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
                    {Array.from({ length: 24 }, (_, i) => (i + 1) * 5).map(seconds => (
                      <SelectItem key={seconds} value={seconds.toString()}>
                        {seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`}
                      </SelectItem>
                    ))}
                    
                    {Array.from({ length: 12 }, (_, i) => 120 + (i + 1) * 15).map(seconds => (
                      <SelectItem key={seconds} value={seconds.toString()}>
                        {Math.floor(seconds / 60)}m {seconds % 60}s
                      </SelectItem>
                    ))}
                    
                    {Array.from({ length: 19 }, (_, i) => 300 + (i + 1) * 30).map(seconds => (
                      <SelectItem key={seconds} value={seconds.toString()}>
                        {Math.floor(seconds / 60)}m {seconds % 60}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={addExerciseToRoutine}
              className="w-full"
              variant="outline"
              disabled={!selectedExerciseId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Routine
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selected Exercises List */}
      {selectedExercises.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600">
              {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} added
            </div>
            {selectedExercises.length >= 2 && (
              <div className="flex gap-2">
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
            <div className="p-2 bg-blue-50 rounded text-sm text-blue-700">
              Click on exercises below to select them for grouping into a superset
            </div>
          )}
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                  >
                    <div />
                  </SortableExerciseItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add Exercise Button */}
      <Button 
        onClick={() => setShowExerciseModal(true)}
        className="w-full"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Exercise
      </Button>

      {/* Save Button */}
      <div className="pt-4 border-t">
        <Button 
          onClick={handleSaveRoutine}
          className="w-full"
          disabled={createRoutineMutation.isPending || selectedExercises.length === 0}
        >
          {createRoutineMutation.isPending ? 'Creating...' : 'Save Routine'}
        </Button>
      </div>

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