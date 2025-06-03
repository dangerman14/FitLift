import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  History, 
  Dumbbell, 
  Settings,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const handleStartWorkout = () => {
    setLocation("/workout-session");
  };
  
  const handleViewWorkouts = () => {
    setLocation("/workouts");
  };
  
  const handleViewRoutines = () => {
    setLocation("/routines");
  };
  
  const handleViewSettings = () => {
    setLocation("/settings");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleStartWorkout}>
          <CardContent className="p-6 text-center">
            <Play className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold">Start Workout</h3>
            <p className="text-sm text-gray-600">Begin a new session</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewWorkouts}>
          <CardContent className="p-6 text-center">
            <History className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold">Workout History</h3>
            <p className="text-sm text-gray-600">View past workouts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewRoutines}>
          <CardContent className="p-6 text-center">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold">Routines</h3>
            <p className="text-sm text-gray-600">Manage templates</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewSettings}>
          <CardContent className="p-6 text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-gray-600" />
            <h3 className="font-semibold">Settings</h3>
            <p className="text-sm text-gray-600">Configure app</p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Welcome to FitTracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Ready to start your fitness journey? The partial reps feature is now available in Settings.
            Enable it to track your full reps and partial reps separately during workouts.
          </p>
          <div className="mt-4">
            <Button onClick={handleViewSettings} variant="outline">
              Configure Partial Reps
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}