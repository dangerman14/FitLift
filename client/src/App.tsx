import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Fitness Tracker</h1>
          <p className="text-neutral-600">App is being restored...</p>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
