import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Trophy, Target, Image, Camera, ArrowLeft, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWorkout } from "@/contexts/WorkoutContext";

export default function WorkoutComplete() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const workoutId = params.workoutId;
  const { setActiveWorkout } = useWorkout();
  
  // Function to go back to edit the workout
  const handleBackToWorkout = () => {
    if (workout.slug) {
      setLocation(`/workout-session/${workout.slug}?edit=true`);
    } else {
      setLocation(`/workout-session?template=${workout.templateId}`);
    }
  };
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutImageUrl, setWorkoutImageUrl] = useState('');
  const [workoutDate, setWorkoutDate] = useState('');
  const [workoutTime, setWorkoutTime] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Get workout details and statistics
  const { data: workoutData } = useQuery({
    queryKey: [`/api/workouts/${workoutId}`],
    enabled: !!workoutId,
  });

  // Extract workout and exercises from the same query response
  const workout = workoutData || {};
  const workoutExercises = workoutData?.exercises || [];

  // Clear active workout when reaching this page to hide "workout in progress" indicator
  useEffect(() => {
    setActiveWorkout(null);
  }, [setActiveWorkout]);

  // Navigation guard - prevent leaving without saving or discarding
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved) {
        e.preventDefault();
        e.returnValue = 'You have unsaved workout data. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSaved]);

  // Initialize form with workout data
  useEffect(() => {
    if (workout) {
      console.log("Workout data received:", workout);
      // Use the workout template name if available, otherwise use the workout name
      const displayName = workout.templateName || workout.name || `Workout ${new Date().toLocaleDateString()}`;
      setWorkoutName(displayName);
      setWorkoutDescription(workout.description || '');
      setWorkoutImageUrl(workout.imageUrl || '');
      
      // Initialize date and time from startTime
      if (workout.startTime) {
        const startDate = new Date(workout.startTime);
        setWorkoutDate(startDate.toISOString().split('T')[0]); // YYYY-MM-DD format
        setWorkoutTime(startDate.toTimeString().slice(0, 5)); // HH:mm format
      }
      
      // Use stored duration if available, otherwise calculate from times
      if (workout.duration && workout.duration > 0) {
        console.log("Using stored duration:", workout.duration, "seconds");
        const durationMinutes = Math.round(workout.duration / 60);
        setWorkoutDuration(Math.max(1, durationMinutes).toString());
      } else if (workout.startTime && workout.endTime) {
        console.log("Calculating duration from:", workout.startTime, "to:", workout.endTime);
        const durationMilliseconds = new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime();
        const durationMinutes = Math.round(durationMilliseconds / (1000 * 60));
        console.log("Duration calculated:", durationMinutes, "minutes");
        
        // If workout is less than 1 minute, show as 1 minute minimum
        const finalDuration = Math.max(1, durationMinutes);
        setWorkoutDuration(finalDuration.toString());
      } else {
        console.log("Missing time data - startTime:", workout.startTime, "endTime:", workout.endTime);
        // Set a reasonable default duration when no duration is stored
        setWorkoutDuration("20");
      }
    }
  }, [workout]);

  // Get proper workout data with type safety
  const workoutInfo = workout || {};
  const exerciseData = workoutExercises || [];

  // Calculate workout statistics
  const workoutStats = React.useMemo(() => {
    if (!exerciseData || !Array.isArray(exerciseData)) {
      return {
        totalSets: 0,
        totalReps: 0,
        totalVolume: 0,
        exercisesCompleted: 0,
        duration: 0
      };
    }

    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;
    let exercisesCompleted = exerciseData.length;

    exerciseData.forEach((exercise: any) => {
      if (exercise.sets && Array.isArray(exercise.sets)) {
        exercise.sets.forEach((set: any) => {
          totalSets++;
          totalReps += set.reps || 0;
          totalVolume += (set.weight || 0) * (set.reps || 0);
        });
      }
    });

    // Use stored duration from database if available, otherwise calculate from times
    const duration = workoutInfo.duration && workoutInfo.duration > 0
      ? Math.round(workoutInfo.duration / 60) // Convert seconds to minutes
      : workoutInfo.startTime && workoutInfo.endTime 
        ? Math.round((new Date(workoutInfo.endTime).getTime() - new Date(workoutInfo.startTime).getTime()) / (1000 * 60))
        : parseInt(workoutDuration) || 0; // Use form value as fallback

    return {
      totalSets,
      totalReps,
      totalVolume: Math.round(totalVolume * 10) / 10,
      exercisesCompleted,
      duration
    };
  }, [exerciseData, workoutInfo, workoutDuration]);

  // Update workout details mutation
  const updateWorkoutMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      description: string; 
      imageUrl: string;
      date: string;
      time: string;
      duration: string;
    }) => {
      // Combine date and time to create new start time
      const startTime = new Date(`${data.date}T${data.time}`);
      
      // Parse duration - handle both "13" (minutes) and "13:06" (minutes:seconds) formats
      let totalSeconds = 0;
      if (data.duration.includes(':')) {
        const [minutes, seconds] = data.duration.split(':').map(num => parseInt(num) || 0);
        totalSeconds = (minutes * 60) + seconds;
      } else {
        const minutes = parseInt(data.duration) || 0;
        totalSeconds = minutes * 60;
      }
      
      const endTime = new Date(startTime.getTime() + totalSeconds * 1000);
      
      const response = await fetch(`/api/workouts/${workoutId}/details`, {
        method: "PATCH",
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: totalSeconds // Store total seconds in database
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error('Failed to update workout');
      return response.json();
    },
    onSuccess: () => {
      setIsSaved(true);
      // Clear the active workout from context since it's now complete
      setActiveWorkout(null);
      toast({
        title: "Workout saved!",
        description: "Your workout details have been updated.",
      });
      // Refresh the workout data to show updated duration immediately
      queryClient.invalidateQueries({ queryKey: [`/api/workouts/${workoutId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workout details.",
        variant: "destructive",
      });
    },
  });

  // Discard workout mutation
  const discardWorkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error('Failed to discard workout');
      return response.json();
    },
    onSuccess: () => {
      setIsSaved(true);
      setActiveWorkout(null);
      toast({
        title: "Workout Discarded",
        description: "Your workout has been discarded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to discard workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDiscard = () => {
    discardWorkoutMutation.mutate();
    setIsDiscardDialogOpen(false);
  };

  const handleSave = () => {
    updateWorkoutMutation.mutate({
      name: workoutName,
      description: workoutDescription,
      imageUrl: workoutImageUrl,
      date: workoutDate,
      time: workoutTime,
      duration: workoutDuration
    });
  };

  const getWeightDisplay = (weight: number) => {
    const userData = user || {};
    if (userData.weightUnit === 'lbs' && weight > 0) {
      return `${Math.round(weight * 2.20462 * 10) / 10} lbs`;
    }
    return `${weight} kg`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToWorkout}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-200" />
              <div>
                <h1 className="text-3xl font-bold">Workout Complete!</h1>
                <p className="text-green-100">Great job pushing your limits</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm text-green-100">Duration</span>
              </div>
              <div className="text-2xl font-bold">{workoutStats.duration}min</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-sm text-green-100">Sets</span>
              </div>
              <div className="text-2xl font-bold">{workoutStats.totalSets}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-sm text-green-100">Total Reps</span>
              </div>
              <div className="text-2xl font-bold">{workoutStats.totalReps}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-sm text-green-100">Volume</span>
              </div>
              <div className="text-2xl font-bold">{getWeightDisplay(workoutStats.totalVolume)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Workout Details Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Customize Your Workout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Workout Name</label>
              <Input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="Enter workout name"
                className="text-lg"
              />
            </div>
            
            {/* Date, Time, and Duration Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  type="date"
                  value={workoutDate}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <Input
                  type="time"
                  value={workoutTime}
                  onChange={(e) => setWorkoutTime(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                <Input
                  type="number"
                  value={workoutDuration}
                  onChange={(e) => setWorkoutDuration(e.target.value)}
                  placeholder="Duration in minutes"
                  className="text-lg"
                  min="1"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                placeholder="How did this workout go? Any notes or achievements..."
                rows={4}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                <Camera className="h-4 w-4 inline mr-1" />
                Workout Photo
              </label>
              <Input
                value={workoutImageUrl}
                onChange={(e) => setWorkoutImageUrl(e.target.value)}
                placeholder="Paste image URL to add a photo..."
              />
              {workoutImageUrl && (
                <div className="mt-3">
                  <img 
                    src={workoutImageUrl} 
                    alt="Workout preview" 
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exercise Summary */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Exercise Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exerciseData && Array.isArray(exerciseData) && exerciseData.length > 0 ? exerciseData.map((exercise: any, index: number) => {
                const allSets = exercise.sets || [];
                const maxWeight = allSets.length > 0 ? Math.max(...(allSets.map((set: any) => set.weight || 0))) : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{exercise.exercise?.name || 'Unknown Exercise'}</h3>
                      <p className="text-sm text-gray-600">
                        {allSets.length} sets • Best: {getWeightDisplay(maxWeight)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {allSets.reduce((total: number, set: any) => total + (set.reps || 0), 0)} reps
                    </Badge>
                  </div>
                );
              }) : (
                <p className="text-gray-500 text-center py-8">No exercises completed in this workout</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/")}
            className="flex-1"
          >
            Skip & Return Home
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateWorkoutMutation.isPending}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            {updateWorkoutMutation.isPending ? "Saving..." : "Save Workout"}
          </Button>
        </div>
      </div>
    </div>
  );
}