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
  Plus, 
  X,
  ArrowLeft,
  Save,
  Search,
  Filter,
  ChevronDown
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RoutineSet {
  reps: string; // Will store as "10-12" format
  weight?: string;
}

interface RoutineExercise {
  exerciseId: number;
  exerciseName: string;
  sets: RoutineSet[];
  restDuration: number; // Rest time in seconds for all sets
  notes?: string;
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        weight: weight || undefined,
      })),
      restDuration: parseInt(restDuration),
      notes: notes || undefined,
    };

    setSelectedExercises([...selectedExercises, routineExercise]);
    setSelectedExerciseId("");
    setSets("3");
    setSingleReps("10");
    setMinReps("8");
    setMaxReps("12");
    setWeight("");
    setNotes("");
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
        weight: set.weight || null
      }));
      
      const firstSet = exercise.sets[0];
      return {
        exerciseId: exercise.exerciseId,
        setsTarget: exercise.sets.length,
        repsTarget: parseInt(firstSet.reps) || 10,
        weightTarget: parseFloat(firstSet.weight) || null,
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
              </div>
              
              <div className="space-y-2">
                <Label>Weight (Optional)</Label>
                <Input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 135 lbs, bodyweight"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., slow tempo, pause at bottom"
                />
              </div>
              
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
              <CardTitle className="flex items-center justify-between">
                <span>Routine Exercises ({selectedExercises.length})</span>
                {selectedExercises.length > 0 && (
                  <span className="text-sm font-normal text-gray-600">
                    Total: {selectedExercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedExercises.length > 0 ? (
                <div className="space-y-4">
                  {selectedExercises.map((exercise, exerciseIndex) => (
                    <div 
                      key={`${exercise.exerciseId}-${exerciseIndex}`}
                      className="border rounded-lg bg-white"
                    >
                      {/* Exercise Header */}
                      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                        <div className="flex-1">
                          <div className="font-medium text-lg">{exercise.exerciseName}</div>
                          <div className="text-sm text-gray-600">
                            {exercise.sets.length} sets • Rest: {(() => {
                              const seconds = exercise.restDuration;
                              const mins = Math.floor(seconds / 60);
                              const secs = seconds % 60;
                              return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                            })()}
                          </div>
                        </div>
                        
                        {/* Rest Time Selector */}
                        <div className="flex items-center gap-2">
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
                      
                      {/* Sets List */}
                      <div className="p-4 space-y-2">
                        {exercise.sets.map((set, setIndex) => (
                          <div 
                            key={setIndex}
                            className="flex items-center gap-4 p-3 border rounded-md bg-gray-50"
                          >
                            <span className="text-sm font-medium text-gray-600 min-w-[60px]">
                              Set {setIndex + 1}
                            </span>
                            
                            {/* Reps Input */}
                            <div className="flex-1">
                              <Input
                                value={set.reps}
                                onChange={(e) => updateSetField(exerciseIndex, setIndex, 'reps', e.target.value)}
                                placeholder="10"
                                className="h-8 text-sm"
                              />
                              <span className="text-xs text-gray-500">reps</span>
                            </div>
                            
                            {/* Weight Input */}
                            <div className="flex-1">
                              <Input
                                value={set.weight || ""}
                                onChange={(e) => updateSetField(exerciseIndex, setIndex, 'weight', e.target.value)}
                                placeholder="135 lbs"
                                className="h-8 text-sm"
                              />
                              <span className="text-xs text-gray-500">weight</span>
                            </div>
                            
                            {/* Remove Set Button */}
                            {exercise.sets.length > 1 && (
                              <Button
                                onClick={() => removeSet(exerciseIndex, setIndex)}
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
                          onClick={() => addSet(exerciseIndex)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Set
                        </Button>
                        
                        {/* Exercise Notes */}
                        {exercise.notes && (
                          <div className="text-xs text-gray-500 mt-2 italic border-t pt-2">
                            {exercise.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises added yet</h3>
                  <p className="text-gray-600">
                    Start building your routine by adding exercises from the left panel.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}