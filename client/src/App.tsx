import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Simple test page to verify the app works
function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Fitness App</h1>
        <p className="text-gray-600 mb-4">Progressive overload system is ready for testing.</p>
        <div className="space-y-2">
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            ✓ Progressive overload suggestions implemented
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            ✓ Partial reps tracking with "10 (3)" format
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            ✓ Volume calculation with 50% weight contribution
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={TestPage} />
        <Route component={TestPage} />
      </Switch>
    </QueryClientProvider>
  );
}

export default App;