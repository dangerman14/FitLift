import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProgressiveOverloadSuggestion {
  type: 'weight' | 'reps' | 'sets' | 'frequency' | 'volume';
  currentValue: number;
  suggestedValue: number;
  increase: number;
  percentage: number;
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
  priority: number;
}

interface ProgressiveOverloadData {
  exerciseId: number;
  exerciseName: string;
  suggestions: ProgressiveOverloadSuggestion[];
  readyForProgression: boolean;
  trend: 'improving' | 'plateauing' | 'declining' | 'insufficient_data';
  weeksSinceProgress: number;
}

interface ProgressiveOverloadSuggestionsProps {
  exerciseId: number;
  exerciseName: string;
  onApplySuggestion?: (suggestion: ProgressiveOverloadSuggestion) => void;
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case 'plateauing':
      return <Minus className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'improving':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'declining':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'plateauing':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatSuggestionValue = (type: string, value: number) => {
  switch (type) {
    case 'weight':
      return `${value}kg`;
    case 'reps':
    case 'sets':
      return `${value}`;
    case 'frequency':
      return `${value}x/week`;
    case 'volume':
      return `${value}kg`;
    default:
      return `${value}`;
  }
};

export const ProgressiveOverloadSuggestions: React.FC<ProgressiveOverloadSuggestionsProps> = ({
  exerciseId,
  exerciseName,
  onApplySuggestion
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const { data: progressData, isLoading, error } = useQuery({
    queryKey: [`/api/exercises/${exerciseId}/progressive-suggestions`],
    enabled: !!exerciseId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Progressive Overload</CardTitle>
            <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="bg-gray-200 h-3 w-full rounded mb-2"></div>
            <div className="bg-gray-200 h-3 w-3/4 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !progressData) {
    return null; // Hide if no data or error
  }

  const data = progressData as ProgressiveOverloadData;
  const topSuggestion = data?.suggestions?.[0];

  const handleApplySuggestion = (suggestion: ProgressiveOverloadSuggestion) => {
    const suggestionKey = `${suggestion.type}-${suggestion.suggestedValue}`;
    setAppliedSuggestions(prev => new Set(Array.from(prev).concat(suggestionKey)));
    onApplySuggestion?.(suggestion);
  };

  const getSuggestionKey = (suggestion: ProgressiveOverloadSuggestion) => 
    `${suggestion.type}-${suggestion.suggestedValue}`;

  return (
    <Card className="w-full">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Progressive Overload</CardTitle>
                {getTrendIcon(data.trend)}
              </div>
              <div className="flex items-center gap-2">
                {data.readyForProgression && topSuggestion && (
                  <Badge variant="secondary" className="text-xs">
                    Ready to progress
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getTrendColor(data.trend)}`}
                >
                  {data.trend.charAt(0).toUpperCase() + data.trend.slice(1)}
                </Badge>
              </div>
            </div>
            
            {/* Quick preview when collapsed */}
            {!isExpanded && topSuggestion && (
              <div className="text-xs text-gray-600 mt-1">
                Try {formatSuggestionValue(topSuggestion.type, topSuggestion.suggestedValue)} 
                {topSuggestion.type === 'weight' && ` (+${topSuggestion.increase}kg)`}
                {topSuggestion.type === 'reps' && ` (+${topSuggestion.increase} rep)`}
                {topSuggestion.type === 'sets' && ` (+${topSuggestion.increase} set)`}
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {data.weeksSinceProgress > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {data.weeksSinceProgress === 1 
                      ? "1 week since last progress" 
                      : `${data.weeksSinceProgress} weeks since last progress`}
                  </span>
                </div>
              </div>
            )}

            {data.suggestions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No suggestions available yet</p>
                <p className="text-xs">Complete more workouts to get personalized recommendations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.suggestions.slice(0, 3).map((suggestion, index) => {
                  const suggestionKey = getSuggestionKey(suggestion);
                  const isApplied = appliedSuggestions.has(suggestionKey);
                  
                  return (
                    <div 
                      key={index}
                      className={`border rounded-lg p-3 ${
                        index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                      } ${isApplied ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={index === 0 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            #{index + 1}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                          >
                            {suggestion.confidence} confidence
                          </Badge>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          Priority {suggestion.priority}
                        </div>
                      </div>

                      <div className="mb-2">
                        <div className="text-sm font-medium mb-1">
                          {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Progression
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatSuggestionValue(suggestion.type, suggestion.currentValue)} → {' '}
                          <span className="font-medium text-blue-600">
                            {formatSuggestionValue(suggestion.type, suggestion.suggestedValue)}
                          </span>
                          {suggestion.increase > 0 && (
                            <span className="text-green-600 ml-1">
                              (+{Math.abs(suggestion.increase)}{suggestion.type === 'weight' ? 'kg' : ''})
                            </span>
                          )}
                          {suggestion.increase < 0 && (
                            <span className="text-red-600 ml-1">
                              ({suggestion.increase}{suggestion.type === 'weight' ? 'kg' : ''})
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-700 mb-3">
                        {suggestion.reasoning}
                      </p>

                      {suggestion.percentage !== 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Change</span>
                            <span>{suggestion.percentage > 0 ? '+' : ''}{suggestion.percentage.toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={Math.min(Math.abs(suggestion.percentage), 100)} 
                            className="h-1.5"
                          />
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant={isApplied ? "outline" : index === 0 ? "default" : "secondary"}
                        className="w-full text-xs"
                        onClick={() => handleApplySuggestion(suggestion)}
                        disabled={isApplied}
                      >
                        {isApplied ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Applied
                          </div>
                        ) : (
                          `Apply ${suggestion.type} suggestion`
                        )}
                      </Button>
                    </div>
                  );
                })}

                {data.suggestions.length > 3 && (
                  <div className="text-center">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View {data.suggestions.length - 3} more suggestions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};