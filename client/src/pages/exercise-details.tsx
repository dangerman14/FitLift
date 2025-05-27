import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Trophy, Calendar, Weight, Target, Play, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { Exercise } from "@shared/schema";

export default function ExerciseDetails() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const exerciseId = params.exerciseId;
  const { user } = useAuth();
  
  const [chartFilter, setChartFilter] = useState<'volume' | 'weight'>('weight');
  const [dateFilter, setDateFilter] = useState<'3months' | '1year' | 'all'>('3months');

  // Fetch exercise details
  const { data: exercise, isLoading: exerciseLoading } = useQuery<Exercise>({
    queryKey: [`/api/exercises/${exerciseId}`],
    enabled: !!exerciseId,
  });

  // Fetch exercise history/progress
  const { data: exerciseHistory } = useQuery<any[]>({
    queryKey: [`/api/exercises/${exerciseId}/history`],
    enabled: !!exerciseId,
  });

  // Fetch personal records for this exercise
  const { data: personalRecords } = useQuery<any>({
    queryKey: [`/api/exercises/${exerciseId}/records`],
    enabled: !!exerciseId,
  });

  if (exerciseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exercise details...</p>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Exercise Not Found</h1>
          <p className="text-gray-600 mb-4">The exercise you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/exercises")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exercises
          </Button>
        </div>
      </div>
    );
  }

  const getWeightDisplay = (weight: number) => {
    const unit = user?.weightUnit || 'lbs';
    return `${weight} ${unit}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFilteredChartData = () => {
    if (!exerciseHistory) return [];
    
    const now = new Date();
    let filterDate = new Date();
    
    switch (dateFilter) {
      case '3months':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case '1year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        filterDate = new Date(0); // Beginning of time
        break;
    }

    return exerciseHistory
      .filter((record: any) => new Date(record.date) >= filterDate)
      .map((record: any) => {
        // Calculate best set volume as weight × reps (assuming best set)
        const bestSetVolume = (record.maxWeight || 0) * 10; // Estimate 10 reps for volume calculation
        
        return {
          date: formatDate(record.date),
          weight: record.maxWeight || 0,
          volume: bestSetVolume,
          reps: record.maxReps || 10
        };
      });
  };

  const chartData = getFilteredChartData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/exercises")}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{exercise.name}</h1>
              <p className="text-blue-100 mt-1">{exercise.description}</p>
            </div>
          </div>

          {/* Muscle Groups */}
          <div className="flex flex-wrap gap-2 mb-4">
            {exercise.muscleGroups?.map((muscle: string, index: number) => (
              <Badge key={index} variant="secondary" className="bg-white/20 text-white border-white/30">
                {muscle}
              </Badge>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-sm text-blue-100">Max Weight</span>
              </div>
              <div className="text-2xl font-bold">{getWeightDisplay(personalRecords?.maxWeight || 0)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Weight className="h-4 w-4" />
                <span className="text-sm text-blue-100">Best Volume</span>
              </div>
              <div className="text-2xl font-bold">{getWeightDisplay(personalRecords?.bestVolume || 0)}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-sm text-blue-100">Times Performed</span>
              </div>
              <div className="text-2xl font-bold">{personalRecords?.timesPerformed || 0}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm text-blue-100">Last Performed</span>
              </div>
              <div className="text-sm font-medium">
                {personalRecords?.lastPerformed ? formatDate(personalRecords.lastPerformed) : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">Progress & Records</TabsTrigger>
            <TabsTrigger value="history">Exercise History</TabsTrigger>
            <TabsTrigger value="details">Exercise Information</TabsTrigger>
          </TabsList>

          {/* Progress & Records Tab */}
          <TabsContent value="progress" className="space-y-6">
            {/* Interactive Chart */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [
                            chartFilter === 'weight' ? getWeightDisplay(value) : `${value} total`,
                            chartFilter === 'weight' ? 'Weight' : 'Volume'
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey={chartFilter} 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No data available for the selected period</p>
                      <p className="text-sm text-gray-500">Start tracking this exercise to see your progress!</p>
                    </div>
                  </div>
                )}
                
                {/* Chart Filter Buttons */}
                <div className="mt-4 flex flex-wrap gap-4 justify-center border-t pt-4">
                  <div className="flex gap-2">
                    <Button
                      variant={chartFilter === 'weight' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartFilter('weight')}
                      className="flex items-center gap-2"
                    >
                      <Weight className="h-4 w-4" />
                      Heaviest Weight
                    </Button>
                    <Button
                      variant={chartFilter === 'volume' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartFilter('volume')}
                      className="flex items-center gap-2"
                    >
                      <Target className="h-4 w-4" />
                      Best Set Volume
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={dateFilter === '3months' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateFilter('3months')}
                    >
                      3 Months
                    </Button>
                    <Button
                      variant={dateFilter === '1year' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateFilter('1year')}
                    >
                      1 Year
                    </Button>
                    <Button
                      variant={dateFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateFilter('all')}
                    >
                      All Time
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Records */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Personal Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy className="h-6 w-6 text-yellow-600" />
                      <h3 className="font-semibold text-yellow-800">Heaviest Weight</h3>
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {getWeightDisplay(personalRecords?.maxWeight || 0)}
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      {personalRecords?.maxWeightDate ? `Set on ${formatDate(personalRecords.maxWeightDate)}` : 'No records yet'}
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Weight className="h-6 w-6 text-green-600" />
                      <h3 className="font-semibold text-green-800">Best Set Volume</h3>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {getWeightDisplay(personalRecords?.bestVolume || 0)}
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {personalRecords?.bestVolumeDate ? `Set on ${formatDate(personalRecords.bestVolumeDate)}` : 'No records yet'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Exercise History</CardTitle>
              </CardHeader>
              <CardContent>
                {exerciseHistory && exerciseHistory.length > 0 ? (
                  <div className="space-y-6">
                    {exerciseHistory.map((session: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg border p-6">
                        {/* Workout Header */}
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {session.workoutName || 'Workout Session'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(session.date).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}, {new Date(session.date).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {/* Sets Header */}
                        <div className="mb-3">
                          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 border-b border-gray-300 pb-2">
                            <div>Set</div>
                            <div>Weight & Reps</div>
                            <div>RPE</div>
                          </div>
                        </div>

                        {/* Sets Data */}
                        <div className="space-y-2">
                          {session.sets && session.sets.length > 0 ? session.sets.map((set: any, setIndex: number) => (
                            <div key={setIndex} className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-gray-200 last:border-b-0">
                              <div className="font-medium text-gray-600">
                                {set.setNumber || setIndex + 1}
                              </div>
                              <div className="font-semibold">
                                {getWeightDisplay(set.weight || 0)} × {set.reps || 0}
                              </div>
                              <div className="text-gray-600">
                                {set.rpe ? `@ ${set.rpe} RPE` : '-'}
                              </div>
                            </div>
                          )) : (
                            <div className="grid grid-cols-3 gap-4 text-sm py-2">
                              <div className="font-medium text-gray-600">1</div>
                              <div className="font-semibold">
                                {getWeightDisplay(session.maxWeight || 0)} × {session.maxReps || 0}
                              </div>
                              <div className="text-gray-600">-</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No exercise history found</p>
                    <p className="text-sm text-gray-500">Start including this exercise in your workouts to build history!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exercise Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exercise Image */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Exercise Demonstration</CardTitle>
                </CardHeader>
                <CardContent>
                  {exercise.imageUrl ? (
                    <img 
                      src={exercise.imageUrl} 
                      alt={exercise.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Weight className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No image available</p>
                      </div>
                    </div>
                  )}
                  
                  {exercise.videoUrl && (
                    <Button className="w-full mt-4" variant="outline" asChild>
                      <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="h-4 w-4 mr-2" />
                        Watch Video Demonstration
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Exercise Information */}
              <div className="space-y-6">
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle>Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {exercise.instructions || 'No instructions available'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle>Exercise Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Equipment Required</h3>
                      <div className="flex flex-wrap gap-2">
                        {exercise.equipmentRequired?.map((equipment: string, index: number) => (
                          <Badge key={index} variant="outline">{equipment}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Primary Muscle Groups</h3>
                      <div className="flex flex-wrap gap-2">
                        {exercise.primaryMuscleGroups?.map((muscle: string, index: number) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800">{muscle}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Secondary Muscle Groups</h3>
                      <div className="flex flex-wrap gap-2">
                        {exercise.secondaryMuscleGroups?.map((muscle: string, index: number) => (
                          <Badge key={index} className="bg-gray-100 text-gray-700">{muscle}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-1">Movement Pattern</h3>
                      <Badge variant="secondary">{exercise.movementPattern}</Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-1">Exercise Type</h3>
                      <Badge variant="secondary">{exercise.exerciseType}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}