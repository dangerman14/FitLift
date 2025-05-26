import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Clock, Hash, Weight, Plus } from "lucide-react";
import { Link } from "wouter";

export default function RoutineDetails() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  
  console.log('RoutineDetails - Slug from params:', slug);
  
  const { data: routineData, isLoading: routineLoading } = useQuery({
    queryKey: [`/api/workout-templates/slug/${slug}`],
    enabled: !!slug,
  });

  // Handle the case where the API returns an array instead of a single object
  const routine = Array.isArray(routineData) ? routineData[0] : routineData;
  
  // Extract exercises from the routine data (they're included in the workout template response)
  const exercises = routine?.exercises || [];
  const exercisesLoading = routineLoading;

  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  if (routineLoading || exercisesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Routine Not Found</h1>
            <Link href="/routines">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Routines
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatRestTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const formatReps = (repsData: string) => {
    try {
      const parsed = JSON.parse(repsData);
      if (parsed.setsData && Array.isArray(parsed.setsData)) {
        return parsed.setsData.map((set: any, index: number) => (
          <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
            Set {index + 1}: {set.reps} reps {set.weight ? `@ ${set.weight} ${user?.weightUnit || 'lbs'}` : '(bodyweight)'}
          </div>
        ));
      }
    } catch (e) {
      // Fallback for simple string format
    }
    return <div className="text-sm text-gray-600 dark:text-gray-300">{routine.repsTarget || 'N/A'} reps</div>;
  };

  const totalSets = exercises?.reduce((total: number, ex: any) => total + (ex.setsTarget || 0), 0) || 0;
  const estimatedDuration = exercises?.reduce((total: number, ex: any) => {
    const exerciseTime = (ex.setsTarget || 0) * 2; // 2 minutes per set average
    const restTime = ((ex.setsTarget || 0) - 1) * ((ex.restDuration || 120) / 60); // rest between sets
    return total + exerciseTime + restTime;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/routines">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{routine.name}</h1>
              {routine.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-1">{routine.description}</p>
              )}
            </div>
          </div>
          <Button onClick={() => setLocation(`/create-routine?edit=${routine?.id}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Routine
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{exercises?.length || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Exercises</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Weight className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSets}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Sets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(estimatedDuration)}m</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Est. Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exercises List */}
        <Card>
          <CardHeader>
            <CardTitle>Exercises</CardTitle>
            <CardDescription>
              Complete the exercises in order for the best results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exercises && exercises.length > 0 ? (
              <div className="space-y-4">
                {exercises.map((exercise: any, index: number) => (
                  <div key={exercise.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {exercise.exercise?.name || 'Unknown Exercise'}
                          </h3>
                        </div>
                        
                        {exercise.exercise?.description && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                            {exercise.exercise.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sets & Reps</p>
                            <div className="space-y-1">
                              {exercise.notes ? formatReps(exercise.notes) : (
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                  {exercise.setsTarget || 3} sets × {exercise.repsTarget || 10} reps
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rest Time</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {formatRestTime(exercise.restDuration || 120)}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                              {exercise.exercise?.equipmentType?.replace('_', ' ') || 'None'}
                            </p>
                          </div>
                        </div>

                        {exercise.exercise?.primaryMuscleGroups && exercise.exercise.primaryMuscleGroups.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Muscles</p>
                            <div className="flex flex-wrap gap-1">
                              {exercise.exercise.primaryMuscleGroups.map((muscle: string) => (
                                <Badge key={muscle} variant="secondary" className="text-xs capitalize">
                                  {muscle.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Weight className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No exercises yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  This routine is empty. Add some exercises to get started with your workout.
                </p>
                <Button onClick={() => setLocation(`/create-routine?edit=${routine?.id}`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exercises
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}