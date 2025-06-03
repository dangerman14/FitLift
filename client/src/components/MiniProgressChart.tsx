import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface MiniProgressChartProps {
  exerciseHistory: {
    date: string;
    strengthScore: number;
    maxWeight: number;
    repsAtMaxWeight: number;
  }[];
}

// Custom tooltip component for chart hover
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
        <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
        {data.maxWeight > 0 ? (
          <p>{data.maxWeight}kg × {data.repsAtMaxWeight} reps</p>
        ) : (
          <p>{data.repsAtMaxWeight} reps</p>
        )}
        <p className="text-gray-600">Score: {data.strengthScore}</p>
      </div>
    );
  }
  return null;
};

export const MiniProgressChart = ({ exerciseHistory }: MiniProgressChartProps) => {
  // Don't render if no data
  if (!exerciseHistory || exerciseHistory.length === 0) {
    return (
      <div className="w-20 h-8 flex items-center justify-center text-gray-400">
        <span className="text-xs">No data</span>
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
            className={`cursor-help ${isIncreasing ? "text-green-600" : "text-neutral-500"}`}
            title={`Progressive Overload Tracker - Sessions tracked: ${progressInfo.sessions}. First session: ${progressInfo.earliest.maxWeight > 0 ? `${progressInfo.earliest.maxWeight}kg × ${progressInfo.earliest.repsAtMaxWeight}` : `${progressInfo.earliest.repsAtMaxWeight} reps`}. Latest session: ${progressInfo.latest.maxWeight > 0 ? `${progressInfo.latest.maxWeight}kg × ${progressInfo.latest.repsAtMaxWeight}` : `${progressInfo.latest.repsAtMaxWeight} reps`}. ${isIncreasing ? '↗ Progressing' : '→ Maintaining'}${isIncreasing && progressInfo.percentChange !== '0' ? ` (+${progressInfo.percentChange}%)` : ''}`}
          >
            {isIncreasing ? "↗" : "→"}
          </span>
        )}
      </div>
    </div>
  );
};