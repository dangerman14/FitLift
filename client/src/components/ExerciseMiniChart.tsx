import { useQuery } from "@tanstack/react-query";
import { MiniProgressChart } from "./MiniProgressChart";

interface ExerciseMiniChartProps {
  exerciseId?: number;
}

export function ExerciseMiniChart({ exerciseId }: ExerciseMiniChartProps) {
  const { data: chartData } = useQuery({
    queryKey: ['/api/exercises', exerciseId, 'mini-chart'],
    enabled: !!exerciseId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (!exerciseId) {
    return null;
  }

  return <MiniProgressChart exerciseHistory={chartData as any[] || []} />;
}