import { useQuery } from "@tanstack/react-query";
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
  Target
} from "lucide-react";
import { useState } from "react";
import WorkoutModal from "@/components/workout-modal";

export default function Dashboard() {
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const { data: workoutStats } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: workouts } = useQuery({
    queryKey: ["/api/workouts"],
  });

  const { data: workoutTemplates } = useQuery({
    queryKey: ["/api/workout-templates"],
  });

  const recentWorkouts = workouts?.slice(0, 3) || [];
  const lastWorkout = recentWorkouts[0];

  const handleStartWorkout = (template?: any) => {
    setSelectedTemplate(template);
    setIsWorkoutModalOpen(true);
  };

  const handleQuickStart = () => {
    setSelectedTemplate(null);
    setIsWorkoutModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
    <div className="space-y-6">
      {/* Quick Actions Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-neutral-900">Quick Start</h2>
          <span className="text-sm text-neutral-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start New Workout Card */}
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-material-2 border-0">
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
                    onClick={() => handleStartWorkout(lastWorkout)}
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
                {workoutStats?.totalWorkouts || 0}
              </div>
              <div className="text-sm text-neutral-600 mb-2">Workouts</div>
              <Progress value={80} className="h-2" />
            </CardContent>
          </Card>

          {/* Total Volume */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">
                {Math.round((workoutStats?.totalVolume || 0) / 1000)}k
              </div>
              <div className="text-sm text-neutral-600 mb-1">Volume (lbs)</div>
              <div className="text-xs text-secondary-600">+15% vs last week</div>
            </CardContent>
          </Card>

          {/* Personal Records */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent-500 mb-1">
                {workoutStats?.personalRecords || 0}
              </div>
              <div className="text-sm text-neutral-600 mb-1">New PRs</div>
              <Trophy className="h-4 w-4 text-accent-500 mx-auto" />
            </CardContent>
          </Card>

          {/* Average Duration */}
          <Card className="shadow-material-1 border border-neutral-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning mb-1">
                {workoutStats?.avgDuration || 0}
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
        
        <div className="space-y-3">
          {recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout: any) => (
              <Card key={workout.id} className="shadow-material-1 border border-neutral-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Check className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">
                          Completed {workout.name}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {formatDuration(workout.duration || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-neutral-500">
                        {formatDate(workout.startTime)}
                      </div>
                    </div>
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

      {/* Workout Modal */}
      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        template={selectedTemplate}
      />
    </div>
  );
}
