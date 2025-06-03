import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

export default function MinimalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Minimal App Working</h1>
          <p>Testing React Query integration...</p>
        </div>
      </div>
    </QueryClientProvider>
  );
}