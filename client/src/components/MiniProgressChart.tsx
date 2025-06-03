import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface MiniProgressChartProps {
  exerciseHistory: {
    date: string;
    maxWeight: number;
    repsAtMaxWeight: number;
    strengthScore: number; // weight × reps
  }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const weight = data.maxWeight;
    const reps = data.repsAtMaxWeight;
    const date = new Date(data.date).toLocaleDateString();
    
    return (
      <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-2 text-xs">
        <p className="font-medium">{date}</p>
        <p className="text-blue-600">
          {weight > 0 ? `${weight}kg × ${reps} reps` : `${reps} reps (bodyweight)`}
        </p>
        <p className="text-neutral-500">
          Score: {weight > 0 ? weight * reps : reps}
        </p>
      </div>
    );
  }
  return null;
};

export function MiniProgressChart({ exerciseHistory }: MiniProgressChartProps) {
  if (!exerciseHistory || exerciseHistory.length === 0) {
    return (
      <div className="w-20 h-8 bg-neutral-100 rounded flex items-center justify-center">
        <span className="text-xs text-neutral-400">No data</span>
      </div>
    );
  }

  // Show trend direction and calculate progress
  const isIncreasing = exerciseHistory.length > 1 && 
    exerciseHistory[exerciseHistory.length - 1].strengthScore > exerciseHistory[0].strengthScore;
  
  const trendColor = isIncreasing ? "#10b981" : "#6b7280";
  
  // Calculate progression details
  const getProgressionInfo = () => {
    if (exerciseHistory.length < 2) return null;
    
    const latest = exerciseHistory[exerciseHistory.length - 1];
    const earliest = exerciseHistory[0];
    const scoreDiff = latest.strengthScore - earliest.strengthScore;
    const percentChange = earliest.strengthScore > 0 ? ((scoreDiff / earliest.strengthScore) * 100).toFixed(1) : '0';
    
    return {
      scoreDiff,
      percentChange,
      latest,
      earliest,
      sessions: exerciseHistory.length
    };
  };

  const progressInfo = getProgressionInfo();

  return (
    <div className="flex items-center space-x-2">
      <div className="w-20 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={exerciseHistory}>
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: trendColor, strokeWidth: 1 }}
            />
            <Line 
              type="monotone" 
              dataKey="strengthScore" 
              stroke={trendColor}
              strokeWidth={2}
              dot={{ fill: trendColor, strokeWidth: 0, r: 2 }}
              activeDot={{ r: 4, fill: trendColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-neutral-500">
        {exerciseHistory.length > 1 && progressInfo && (
          <span 
            className={`${isIncreasing ? "text-green-600" : "text-neutral-500"}`}
            title={`${isIncreasing ? 'Progressing' : 'Maintaining'} - ${progressInfo.sessions} sessions tracked`}
          >
            {isIncreasing ? "↗" : "→"}
          </span>
        )}
      </div>
    </div>
  );
}