import { useQuery } from "@tanstack/react-query";
import { MiniProgressChart } from "./MiniProgressChart";

interface ExerciseMiniChartProps {
  exerciseId?: number;
}

export function ExerciseMiniChart({ exerciseId }: ExerciseMiniChartProps) {
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['/api/exercises', exerciseId, 'mini-chart'],
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Debug logging
  console.log(`Mini chart for exercise ${exerciseId}:`, { chartData, isLoading, error });

  if (!exerciseId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="w-20 h-8 bg-neutral-100 rounded flex items-center justify-center">
        <span className="text-xs text-neutral-400">...</span>
      </div>
    );
  }

  return <MiniProgressChart exerciseHistory={chartData as any[] || []} />;
}