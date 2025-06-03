import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { useAuth } from "@/hooks/useAuth";
import { WorkoutProvider } from "@/contexts/WorkoutContext";
import WorkoutProgressIndicator from "@/components/WorkoutProgressIndicator";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Workouts from "@/pages/workouts";
import Exercises from "@/pages/exercises";
import ExerciseDetails from "@/pages/exercise-details";
import Routines from "@/pages/routines";
import CreateRoutine from "@/pages/create-routine";

import Profile from "@/pages/profile";
import BodyTracking from "@/pages/body-tracking";
import AddBodyEntry from "@/pages/add-body-entry";
import EditBodyEntry from "@/pages/edit-body-entry";
import ProgressEntry from "@/pages/progress-entry";
import Settings from "@/pages/settings";
import WorkoutSession from "@/pages/workout-session";
import WorkoutComplete from "@/pages/workout-complete";
import WorkoutSummary from "@/pages/workout-summary";
import RoutineDetails from "@/pages/routine-details";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/navigation";

function SimpleTest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-800 mb-4">Fitness App</h1>
        <p className="text-neutral-600">Testing basic functionality...</p>
      </div>
    </div>
  );
}

function Router() {
  // Temporarily bypass auth to test basic rendering
  return <SimpleTest />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkoutProvider>
        <Toaster />
        <OfflineIndicator />
        <Router />
        <WorkoutProgressIndicator />
      </WorkoutProvider>
    </QueryClientProvider>
  );
}

export default App;
