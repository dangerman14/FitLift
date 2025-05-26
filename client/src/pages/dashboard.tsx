import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  History, 
  Dumbbell, 
  Check, 
  Trophy, 
  TrendingUp,
  Calendar,
  Target,
  Heart,
  MessageCircle,
  Share,
  Zap,
  Disc,
  Square
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: workoutStats } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: workouts } = useQuery({
    queryKey: ["/api/workouts"],
  });

  const { data: workoutTemplates } = useQuery({
    queryKey: ["/api/workout-templates"],
  });

  const recentWorkouts = (workouts && Array.isArray(workouts)) ? workouts.slice(0, 3) : [];
  const lastWorkout = recentWorkouts[0];

  const handleStartWorkout = () => {
    setLocation("/workout-session");
  };

  const handleQuickStart = () => {
    setLocation("/workout-session");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatVolume = (volume: number) => {
    const unit = user?.weightUnit || 'lbs';
    return `${Math.round(volume)} ${unit}`;
  };

  const getExerciseIcon = (exerciseName: string) => {
    const name = exerciseName.toLowerCase();
    
    // Cable exercises
    if (name.includes('cable') || name.includes('pulldown') || name.includes('cable')) {
      return <Zap className="h-4 w-4 text-blue-500" />;
    }
    // Machine exercises
    if (name.includes('machine') || name.includes('press')) {
      return <Square className="h-4 w-4 text-green-500" />;
    }
    // Dumbbell/Barbell exercises
    if (name.includes('dumbbell') || name.includes('barbell') || name.includes('shoulder')) {
      return <Dumbbell className="h-4 w-4 text-orange-500" />;
    }
    // Default exercise icon
    return <Disc className="h-4 w-4 text-gray-500" />;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 space-y-8">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white mx-4 rounded-3xl shadow-large p-8 mb-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            Hello {user?.firstName || 'User'}!
          </h1>
          <p className="text-blue-100 text-lg mb-6">Ready for a challenge?</p>
          <div className="flex justify-center space-x-8 text-center">
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{workoutStats?.totalWorkouts || 0}</div>
              <div className="text-blue-100 text-sm">Workouts</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{Math.round(Number(workoutStats?.totalVolume) || 0)}kg</div>
              <div className="text-blue-100 text-sm">Volume</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{workoutStats?.avgDuration || 0}min</div>
              <div className="text-blue-100 text-sm">Avg Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-neutral-900">Your Workout</h2>
          <span className="text-sm text-neutral-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start New Workout Card */}
          <Card className="bg-gradient-primary text-white shadow-xl-colored border-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">Start New Workout</h3>
                  <p className="text-primary-100 text-sm">Begin your training session</p>
                </div>
                <Play className="h-8 w-8 text-primary-100" />
              </div>
              <Button 
                onClick={handleQuickStart}
                className="w-full"
                style={{ backgroundColor: '#FFFFFF', color: '#1976D2', border: '1px solid #1976D2' }}
              >
                Start Workout
              </Button>
            </CardContent>
          </Card>

          {/* Last Workout Card */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-900">Last Workout</h3>
                  <p className="text-neutral-600 text-sm">
                    {lastWorkout?.name || "No recent workouts"}
                  </p>
                </div>
                <History className="h-6 w-6 text-neutral-400" />
              </div>
              {lastWorkout && (
                <>
                  <div className="text-sm text-neutral-600 mb-3">
                    {formatDate(lastWorkout.startTime)} • {formatDuration(lastWorkout.duration || 0)}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    style={{ color: '#1976D2', borderColor: '#1976D2', backgroundColor: 'transparent' }}
                    onClick={handleStartWorkout}
                  >
                    Repeat Workout
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Overview */}
      <section>
        <h2 className="text-xl font-medium text-neutral-900 mb-4">This Week</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Workouts Completed */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary-600 mb-1">
                {(workoutStats as any)?.totalWorkouts || 0}
              </div>
              <div className="text-sm text-neutral-600 mb-2">Workouts</div>
              <Progress value={80} className="h-2" />
            </CardContent>
          </Card>

          {/* Total Volume */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {Math.round(((workoutStats as any)?.totalVolume || 0) / 1000)}k
              </div>
              <div className="text-sm text-neutral-600 mb-1">Volume (lbs)</div>
              <div className="text-xs text-secondary-600">+15% vs last week</div>
            </CardContent>
          </Card>

          {/* Personal Records */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent-500 mb-1">
                {(workoutStats as any)?.personalRecords || 0}
              </div>
              <div className="text-sm text-neutral-600 mb-1">New PRs</div>
              <Trophy className="h-4 w-4 text-accent-500 mx-auto" />
            </CardContent>
          </Card>

          {/* Average Duration */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning mb-1">
                {(workoutStats as any)?.avgDuration || 0}
              </div>
              <div className="text-sm text-neutral-600 mb-1">Avg Duration (min)</div>
              <div className="text-xs text-neutral-500">-3 min vs last week</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-neutral-900">Recent Activity</h2>
          <Button variant="ghost" className="text-primary-500 hover:text-primary-600">
            View All
          </Button>
        </div>
        
        <div className="space-y-6">
          {recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout: any) => (
              <Card key={workout.id} className="shadow-material-1 border border-neutral-200">
                <CardContent className="p-6">
                  {/* Date and Title */}
                  <div className="mb-4">
                    <div className="text-sm text-neutral-500 mb-1">
                      {formatDate(workout.startTime)}
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {workout.name || "Workout Session"}
                    </h3>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-6 mb-4 text-sm text-neutral-600">
                    <div>
                      <span className="font-medium">Duration:</span> {formatDuration(workout.duration || 0)}
                    </div>
                    <div>
                      <span className="font-medium">Volume:</span> {formatVolume(workout.totalWeight || 0)}
                    </div>
                    <div>
                      <span className="font-medium">Records:</span> {workout.personalRecords || 0} PRs
                    </div>
                  </div>

                  {/* Exercise List */}
                  <div className="mb-4">
                    <div className="space-y-2">
                      {/* Sample exercises with icons */}
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        {getExerciseIcon("Lat Pulldown (Cable)")}
                        <span>3 × Lat Pulldown (Cable)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        {getExerciseIcon("Incline Chest Press (Machine)")}
                        <span>3 × Incline Chest Press (Machine)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        {getExerciseIcon("Shoulder Press (Dumbbell)")}
                        <span>3 × Shoulder Press (Dumbbell)</span>
                      </div>
                      {/* Show more exercises indicator */}
                      {workout.exerciseCount > 3 && (
                        <div className="text-sm text-neutral-500 italic pl-6">
                          see {workout.exerciseCount - 3} more exercises
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-neutral-600">
                    <div>
                      <span className="font-medium">{workout.likes || 0}</span> likes
                    </div>
                    <div>
                      <span className="font-medium">{workout.comments || 0}</span> comments
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-2 text-neutral-600 hover:text-red-500"
                    >
                      <Heart className="h-4 w-4" />
                      Like
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-2 text-neutral-600 hover:text-blue-500"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Comment
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-2 text-neutral-600 hover:text-green-500"
                    >
                      <Share className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-material-1 border border-neutral-200">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Recent Activity</h3>
                <p className="text-neutral-600 mb-4">Start your first workout to see your activity here.</p>
                <Button 
                  onClick={handleQuickStart} 
                  style={{ backgroundColor: '#1976D2', color: '#FFFFFF' }}
                  className="hover:bg-primary-600"
                >
                  Start Your First Workout
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>


    </div>
  );
}
