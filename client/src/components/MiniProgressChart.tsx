import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface MiniProgressChartProps {
  exerciseHistory: {
    date: string;
    maxWeight: number;
    repsAtMaxWeight: number;
    strengthScore: number; // weight × reps
  }[];
}

export function MiniProgressChart({ exerciseHistory }: MiniProgressChartProps) {
  if (!exerciseHistory || exerciseHistory.length === 0) {
    return (
      <div className="w-20 h-8 bg-neutral-100 rounded flex items-center justify-center">
        <span className="text-xs text-neutral-400">No data</span>
      </div>
    );
  }

  // Show trend direction
  const isIncreasing = exerciseHistory.length > 1 && 
    exerciseHistory[exerciseHistory.length - 1].strengthScore > exerciseHistory[0].strengthScore;
  
  const trendColor = isIncreasing ? "#10b981" : "#6b7280";

  return (
    <div className="flex items-center space-x-2">
      <div className="w-20 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={exerciseHistory}>
            <Line 
              type="monotone" 
              dataKey="strengthScore" 
              stroke={trendColor}
              strokeWidth={2}
              dot={{ fill: trendColor, strokeWidth: 0, r: 2 }}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-neutral-500">
        {exerciseHistory.length > 1 && (
          <span className={isIncreasing ? "text-green-600" : "text-neutral-500"}>
            {isIncreasing ? "↗" : "→"}
          </span>
        )}
      </div>
    </div>
  );
}