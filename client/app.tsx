import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Switch, Route, Link, useLocation } from "wouter"
import './src/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Navigation Component
function Navigation() {
  const [location] = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/workouts', label: 'Workouts', icon: '💪' },
    { path: '/exercises', label: 'Exercises', icon: '🏋️' },
    { path: '/routines', label: 'Routines', icon: '📋' },
    { path: '/progress', label: 'Progress', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              FitTracker
            </Link>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
              Start Workout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Progressive Overload Component
function ProgressiveOverloadDemo() {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['/api/progressive-overload/1'],
    queryFn: async () => {
      const response = await fetch('/api/progressive-overload/1');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Progressive Overload Suggestions</h3>
      {suggestions?.suggestions?.map((suggestion: any, index: number) => (
        <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">{suggestion.type}</span>
            <span className="text-sm text-blue-600">{suggestion.confidence}% confidence</span>
          </div>
          <p className="text-gray-700 text-sm mt-1">{suggestion.reason}</p>
          {suggestion.recommendation && (
            <div className="mt-2 p-2 bg-white rounded border">
              <strong>Recommendation:</strong> {suggestion.recommendation}
            </div>
          )}
        </div>
      )) || (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          Progressive overload system ready - add workout data to see suggestions
        </div>
      )}
    </div>
  );
}

// Dashboard Page
function Dashboard() {
  const sampleSets = [
    { reps: 10, partialReps: 3, weight: 135 },
    { reps: 8, partialReps: 2, weight: 135 },
    { reps: 6, partialReps: 4, weight: 135 }
  ];

  const calculateVolume = (weight: number, reps: number, partialReps: number) => {
    return (weight * reps) + (weight * partialReps * 0.5);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Track your fitness progress with advanced features</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <ProgressiveOverloadDemo />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Partial Reps Tracking</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Bench Press - 135 lbs</h4>
            {sampleSets.map((set, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                <span className="font-medium">Set {index + 1}</span>
                <span className="text-lg">
                  {set.reps} {set.partialReps > 0 && `(${set.partialReps})`}
                </span>
                <span className="text-sm text-gray-600">
                  Volume: {calculateVolume(set.weight, set.reps, set.partialReps)} lbs
                </span>
              </div>
            ))}
            <div className="mt-3 pt-2 border-t border-gray-300">
              <div className="flex justify-between">
                <span className="font-semibold">Total Volume:</span>
                <span className="font-semibold">
                  {sampleSets.reduce((total, set) => 
                    total + calculateVolume(set.weight, set.reps, set.partialReps), 0
                  )} lbs
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * Partial reps contribute 50% of full rep volume
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <Link href="/workouts" className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="text-2xl mb-2">💪</div>
            <h4 className="font-medium text-blue-800">Start Workout</h4>
            <p className="text-sm text-blue-600">Begin a new training session</p>
          </Link>
          <Link href="/exercises" className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
            <div className="text-2xl mb-2">🏋️</div>
            <h4 className="font-medium text-green-800">Browse Exercises</h4>
            <p className="text-sm text-green-600">Explore exercise database</p>
          </Link>
          <Link href="/routines" className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
            <div className="text-2xl mb-2">📋</div>
            <h4 className="font-medium text-purple-800">My Routines</h4>
            <p className="text-sm text-purple-600">Manage workout routines</p>
          </Link>
          <Link href="/progress" className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-medium text-orange-800">View Progress</h4>
            <p className="text-sm text-orange-600">Track your improvements</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Page Components
function Workouts() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Workouts</h1>
      <p className="text-gray-600">Workout history and session management</p>
    </div>
  );
}

function Exercises() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Exercises</h1>
      <p className="text-gray-600">Exercise database and progressive overload tracking</p>
    </div>
  );
}

function Routines() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Routines</h1>
      <p className="text-gray-600">Create and manage workout routines</p>
    </div>
  );
}

function Progress() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Progress</h1>
      <p className="text-gray-600">Body measurements and strength progress tracking</p>
    </div>
  );
}

function Settings() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
      <p className="text-gray-600">Configure app preferences and units</p>
    </div>
  );
}

// Layout Component
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-6xl mx-auto p-6">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/workouts" component={Workouts} />
          <Route path="/exercises" component={Exercises} />
          <Route path="/routines" component={Routines} />
          <Route path="/progress" component={Progress} />
          <Route path="/settings" component={Settings} />
          <Route component={Dashboard} />
        </Switch>
      </Layout>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)