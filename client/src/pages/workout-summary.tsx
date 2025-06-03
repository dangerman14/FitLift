import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Trophy, Target, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function WorkoutSummary() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const workoutId = params.workoutId;
  const { user } = useAuth();
  
  // Weight unit preferences state
  const [exerciseWeightUnits, setExerciseWeightUnits] = useState<Record<number, string>>({});

  // Load weight unit preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('exerciseWeightPreferences');
    if (savedPrefs) {
      try {
        setExerciseWeightUnits(JSON.parse(savedPrefs));
      } catch (error) {
        console.error('Error loading weight preferences:', error);
      }
    }
  }, []);

  // Weight unit helper functions
  const getWeightUnit = (exerciseId: number) => {
    return exerciseWeightUnits[exerciseId] || user?.weightUnit || 'kg';
  };

  const getDisplayWeight = (weight: number, exerciseId: number) => {
    const unit = getWeightUnit(exerciseId);
    if (unit === 'lbs' && weight > 0) {
      return Math.round(weight * 2.20462 * 10) / 10; // Convert kg to lbs
    }
    return weight;
  };

  const getWeightUnitLabel = (exerciseId: number, exerciseType?: string) => {
    const unit = getWeightUnit(exerciseId);
    
    if (exerciseType === 'assisted') {
      return `-${unit}`;
    } else if (exerciseType === 'bodyweight_plus_weight') {
      return `+${unit}`;
    } else {
      return unit;
    }
  };

  // Get workout details
  const { data: workoutData, isLoading } = useQuery({
    queryKey: [`/api/workouts/${workoutId}`],
    enabled: !!workoutId,
  });

  const workout = workoutData || {};
  const workoutExercises = workoutData?.exercises || [];

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading workout summary...</p>
        </div>
      </div>
    );
  }

  if (!workout.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Workout Not Found</h2>
          <p className="text-neutral-600 mb-4">The workout you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="mb-4 text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">{workout.name}</h1>
                {workout.description && (
                  <p className="text-neutral-600 mt-2">{workout.description}</p>
                )}
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Completed
                </Badge>
              </div>
            </div>
            
            {/* Workout Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-neutral-500">Date</p>
                  <p className="font-medium">{formatDate(workout.startTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-neutral-500">Time</p>
                  <p className="font-medium">{formatTime(workout.startTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-neutral-500">Duration</p>
                  <p className="font-medium">{formatDuration(workout.duration || 0)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-neutral-500">Exercises</p>
                  <p className="font-medium">{workoutExercises.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Summary */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-900">Exercise Summary</h2>
          
          {workoutExercises.length > 0 ? (
            workoutExercises.map((workoutExercise: any, index: number) => (
              <Card key={index} className="shadow-lg bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-neutral-900">
                      {workoutExercise.exercise.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {workoutExercise.sets?.length || 0} sets
                    </Badge>
                  </div>
                  {workoutExercise.exercise.description && (
                    <p className="text-sm text-neutral-600 mt-2">
                      {workoutExercise.exercise.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent>
                  {workoutExercise.sets && workoutExercise.sets.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 text-sm font-medium text-neutral-700 border-b pb-2">
                        <span>Set</span>
                        <span>Weight</span>
                        <span>Reps</span>
                        <span>RPE</span>
                      </div>
                      
                      {workoutExercise.sets.map((set: any, setIndex: number) => (
                        <div key={setIndex} className="grid grid-cols-4 gap-4 text-sm">
                          <span className="font-medium text-neutral-600">{set.setNumber}</span>
                          <span className="text-neutral-900">
                            {set.weight > 0 ? `${getDisplayWeight(set.weight, workoutExercise.exercise.id)} ${getWeightUnitLabel(workoutExercise.exercise.id, workoutExercise.exercise.exerciseType)}` : '—'}
                          </span>
                          <span className="text-neutral-900">
                            {set.reps > 0 ? set.reps : '—'}
                          </span>
                          <span className="text-neutral-900">
                            {set.rpe ? set.rpe : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neutral-500 italic">No sets recorded for this exercise</p>
                  )}
                  
                  {workoutExercise.notes && (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
                      <p className="text-sm text-neutral-700">
                        <strong>Notes:</strong> {workoutExercise.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-lg bg-white">
              <CardContent className="p-8 text-center">
                <p className="text-neutral-500 text-lg">No exercises recorded for this workout</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Workout Notes */}
        {workout.notes && (
          <Card className="shadow-lg bg-white mt-6">
            <CardHeader>
              <CardTitle>Workout Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-700">{workout.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}