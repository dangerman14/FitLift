import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Workouts from "@/pages/workouts";
import Exercises from "@/pages/exercises";
import Routines from "@/pages/routines";
import CreateRoutine from "@/pages/create-routine";
import Progress from "@/pages/progress";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import WorkoutSession from "@/pages/workout-session";
import WorkoutComplete from "@/pages/workout-complete";
import RoutineDetails from "@/pages/routine-details";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/navigation";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <div className="max-w-6xl mx-auto bg-white min-h-screen shadow-material-2">
            <Navigation />
            <main className="p-4 pb-20">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/workout-session" component={WorkoutSession} />
                <Route path="/workout-complete/:workoutId" component={WorkoutComplete} />
                <Route path="/workouts" component={Workouts} />
                <Route path="/exercises" component={Exercises} />
                <Route path="/routines" component={Routines} />
                <Route path="/routine/:slug" component={RoutineDetails} />
                <Route path="/create-routine" component={CreateRoutine} />
                <Route path="/progress" component={Progress} />
                <Route path="/profile" component={Profile} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
