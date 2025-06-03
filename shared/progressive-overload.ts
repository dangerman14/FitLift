/**
 * Progressive Overload Calculation Engine
 * Analyzes workout history and provides intelligent suggestions for progression
 */

export interface WorkoutHistoryEntry {
  date: Date;
  exerciseId: number;
  sets: {
    weight: number;
    reps: number;
    partialReps?: number;
    rpe?: number;
    completed: boolean;
  }[];
}

export interface ProgressiveOverloadSuggestion {
  type: 'weight' | 'reps' | 'sets' | 'frequency' | 'volume';
  currentValue: number;
  suggestedValue: number;
  increase: number;
  percentage: number;
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
  priority: number; // 1-5, higher is more important
}

export interface ExerciseProgressAnalysis {
  exerciseId: number;
  exerciseName: string;
  currentBest: {
    weight: number;
    reps: number;
    volume: number;
    oneRepMax: number;
  };
  trend: 'improving' | 'plateauing' | 'declining' | 'insufficient_data';
  weeksSinceProgress: number;
  suggestions: ProgressiveOverloadSuggestion[];
  readyForProgression: boolean;
}

export class ProgressiveOverloadEngine {
  /**
   * Calculate one-rep max using Brzycki formula
   */
  static calculateOneRepMax(weight: number, reps: number): number {
    if (reps === 1) return weight;
    if (reps > 30) return weight; // Formula not reliable for high reps
    return weight * (36 / (37 - reps));
  }

  /**
   * Calculate training volume for a set
   */
  static calculateSetVolume(weight: number, reps: number, partialReps: number = 0, partialWeight: number = 0.5): number {
    const fullRepsVolume = weight * reps;
    const partialRepsVolume = weight * partialReps * partialWeight;
    return fullRepsVolume + partialRepsVolume;
  }

  /**
   * Analyze RPE trends to determine readiness for progression
   */
  static analyzeRPETrend(rpeHistory: { date: Date; rpe: number }[]): { trend: string; readyForProgression: boolean } {
    if (rpeHistory.length < 3) {
      return { trend: 'insufficient_data', readyForProgression: false };
    }

    const recentRPE = rpeHistory.slice(-3);
    const avgRPE = recentRPE.reduce((sum, entry) => sum + entry.rpe, 0) / recentRPE.length;

    if (avgRPE <= 7) {
      return { trend: 'easy', readyForProgression: true };
    } else if (avgRPE <= 8.5) {
      return { trend: 'moderate', readyForProgression: true };
    } else {
      return { trend: 'hard', readyForProgression: false };
    }
  }

  /**
   * Determine progression trend based on performance history
   */
  static determineProgressionTrend(history: WorkoutHistoryEntry[]): 'improving' | 'plateauing' | 'declining' | 'insufficient_data' {
    if (history.length < 3) return 'insufficient_data';

    // Sort by date
    const sortedHistory = history.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate best performance for each session
    const sessionBests = sortedHistory.map(session => {
      const bestSet = session.sets
        .filter(set => set.completed)
        .reduce((best, set) => {
          const currentOneRM = this.calculateOneRepMax(set.weight, set.reps);
          const bestOneRM = this.calculateOneRepMax(best.weight, best.reps);
          return currentOneRM > bestOneRM ? set : best;
        }, session.sets[0]);
      
      return {
        date: session.date,
        oneRepMax: this.calculateOneRepMax(bestSet.weight, bestSet.reps),
        volume: session.sets.reduce((sum, set) => 
          sum + this.calculateSetVolume(set.weight, set.reps, set.partialReps || 0), 0
        )
      };
    });

    // Analyze recent trend (last 4 sessions)
    const recentSessions = sessionBests.slice(-4);
    if (recentSessions.length < 3) return 'insufficient_data';

    const improvements = recentSessions.slice(1).map((session, index) => {
      const previous = recentSessions[index];
      return {
        strengthImprovement: session.oneRepMax > previous.oneRepMax,
        volumeImprovement: session.volume > previous.volume
      };
    });

    const strengthImprovements = improvements.filter(i => i.strengthImprovement).length;
    const volumeImprovements = improvements.filter(i => i.volumeImprovement).length;
    const totalComparisons = improvements.length;

    if (strengthImprovements >= totalComparisons * 0.7 || volumeImprovements >= totalComparisons * 0.7) {
      return 'improving';
    } else if (strengthImprovements === 0 && volumeImprovements === 0) {
      return 'declining';
    } else {
      return 'plateauing';
    }
  }

  /**
   * Calculate weeks since last meaningful progress
   */
  static calculateWeeksSinceProgress(history: WorkoutHistoryEntry[]): number {
    if (history.length < 2) return 0;

    const sortedHistory = history.sort((a, b) => b.date.getTime() - a.date.getTime());
    const latestSession = sortedHistory[0];
    
    // Find the last session with better performance
    for (let i = 1; i < sortedHistory.length; i++) {
      const currentSession = sortedHistory[i];
      
      const latestBest = latestSession.sets
        .filter(set => set.completed)
        .reduce((best, set) => {
          const currentOneRM = this.calculateOneRepMax(set.weight, set.reps);
          const bestOneRM = this.calculateOneRepMax(best.weight, best.reps);
          return currentOneRM > bestOneRM ? set : best;
        }, latestSession.sets[0]);

      const comparisonBest = currentSession.sets
        .filter(set => set.completed)
        .reduce((best, set) => {
          const currentOneRM = this.calculateOneRepMax(set.weight, set.reps);
          const bestOneRM = this.calculateOneRepMax(best.weight, best.reps);
          return currentOneRM > bestOneRM ? set : best;
        }, currentSession.sets[0]);

      const latestOneRM = this.calculateOneRepMax(latestBest.weight, latestBest.reps);
      const comparisonOneRM = this.calculateOneRepMax(comparisonBest.weight, comparisonBest.reps);

      if (latestOneRM > comparisonOneRM) {
        const daysDiff = Math.floor((latestSession.date.getTime() - currentSession.date.getTime()) / (1000 * 60 * 60 * 24));
        return Math.floor(daysDiff / 7);
      }
    }

    // No progress found in history
    const oldestSession = sortedHistory[sortedHistory.length - 1];
    const daysSinceOldest = Math.floor((latestSession.date.getTime() - oldestSession.date.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(daysSinceOldest / 7);
  }

  /**
   * Generate progressive overload suggestions based on exercise history
   */
  static generateSuggestions(history: WorkoutHistoryEntry[], exerciseName: string): ProgressiveOverloadSuggestion[] {
    if (history.length === 0) {
      return [{
        type: 'weight',
        currentValue: 0,
        suggestedValue: 20, // Conservative starting weight
        increase: 20,
        percentage: 100,
        reasoning: 'No previous data available. Start with a conservative weight to establish baseline.',
        confidence: 'medium',
        priority: 1
      }];
    }

    const suggestions: ProgressiveOverloadSuggestion[] = [];
    const latestSession = history.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    const trend = this.determineProgressionTrend(history);
    const weeksSinceProgress = this.calculateWeeksSinceProgress(history);

    // Get current best performance
    const currentBest = latestSession.sets
      .filter(set => set.completed)
      .reduce((best, set) => {
        const currentOneRM = this.calculateOneRepMax(set.weight, set.reps);
        const bestOneRM = this.calculateOneRepMax(best.weight, best.reps);
        return currentOneRM > bestOneRM ? set : best;
      }, latestSession.sets[0]);

    // Weight progression suggestions
    if (trend === 'improving' || weeksSinceProgress >= 2) {
      const weightIncrease = this.calculateWeightIncrease(currentBest.weight, exerciseName);
      suggestions.push({
        type: 'weight',
        currentValue: currentBest.weight,
        suggestedValue: currentBest.weight + weightIncrease,
        increase: weightIncrease,
        percentage: (weightIncrease / currentBest.weight) * 100,
        reasoning: trend === 'improving' 
          ? 'You\'ve been consistently improving. Time to increase the weight!'
          : `It's been ${weeksSinceProgress} weeks since your last progress. Try a small weight increase.`,
        confidence: trend === 'improving' ? 'high' : 'medium',
        priority: 1
      });
    }

    // Rep progression suggestions
    if (currentBest.reps < 12 && (trend === 'plateauing' || weeksSinceProgress >= 1)) {
      suggestions.push({
        type: 'reps',
        currentValue: currentBest.reps,
        suggestedValue: currentBest.reps + 1,
        increase: 1,
        percentage: (1 / currentBest.reps) * 100,
        reasoning: 'Try adding one more rep to each set to build endurance before increasing weight.',
        confidence: 'high',
        priority: 2
      });
    }

    // Volume progression (additional sets)
    const currentSets = latestSession.sets.filter(set => set.completed).length;
    if (currentSets < 5 && (trend === 'plateauing' || weeksSinceProgress >= 3)) {
      suggestions.push({
        type: 'sets',
        currentValue: currentSets,
        suggestedValue: currentSets + 1,
        increase: 1,
        percentage: (1 / currentSets) * 100,
        reasoning: 'Add an extra set to increase training volume and stimulate growth.',
        confidence: 'medium',
        priority: 3
      });
    }

    // Deload suggestion for declining performance
    if (trend === 'declining') {
      suggestions.push({
        type: 'weight',
        currentValue: currentBest.weight,
        suggestedValue: currentBest.weight * 0.85,
        increase: currentBest.weight * -0.15,
        percentage: -15,
        reasoning: 'Performance has been declining. Consider a deload week with 85% of your current weight.',
        confidence: 'high',
        priority: 1
      });
    }

    return suggestions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Calculate appropriate weight increase based on exercise type and current weight
   */
  private static calculateWeightIncrease(currentWeight: number, exerciseName: string): number {
    const exerciseType = this.getExerciseType(exerciseName);
    
    switch (exerciseType) {
      case 'compound_lower':
        // Squats, deadlifts - can handle larger increases
        if (currentWeight < 60) return 5;
        if (currentWeight < 100) return 2.5;
        return 1.25;
      
      case 'compound_upper':
        // Bench press, overhead press - moderate increases
        if (currentWeight < 40) return 2.5;
        if (currentWeight < 80) return 1.25;
        return 0.625;
      
      case 'isolation':
        // Bicep curls, tricep extensions - smaller increases
        if (currentWeight < 20) return 1.25;
        return 0.625;
      
      default:
        // General progression
        if (currentWeight < 30) return 2.5;
        if (currentWeight < 60) return 1.25;
        return 0.625;
    }
  }

  /**
   * Categorize exercise type for appropriate progression rates
   */
  private static getExerciseType(exerciseName: string): 'compound_lower' | 'compound_upper' | 'isolation' | 'general' {
    const lowerCompounds = ['squat', 'deadlift', 'leg press', 'hip thrust'];
    const upperCompounds = ['bench press', 'overhead press', 'military press', 'row', 'pull up', 'chin up'];
    const isolations = ['curl', 'extension', 'fly', 'raise', 'calf'];

    const name = exerciseName.toLowerCase();
    
    if (lowerCompounds.some(exercise => name.includes(exercise))) {
      return 'compound_lower';
    }
    if (upperCompounds.some(exercise => name.includes(exercise))) {
      return 'compound_upper';
    }
    if (isolations.some(exercise => name.includes(exercise))) {
      return 'isolation';
    }
    
    return 'general';
  }

  /**
   * Analyze exercise progress and generate comprehensive recommendations
   */
  static analyzeExerciseProgress(
    exerciseId: number,
    exerciseName: string,
    history: WorkoutHistoryEntry[]
  ): ExerciseProgressAnalysis {
    const trend = this.determineProgressionTrend(history);
    const weeksSinceProgress = this.calculateWeeksSinceProgress(history);
    const suggestions = this.generateSuggestions(history, exerciseName);

    // Calculate current best performance
    let currentBest = {
      weight: 0,
      reps: 0,
      volume: 0,
      oneRepMax: 0
    };

    if (history.length > 0) {
      const latestSession = history.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      const bestSet = latestSession.sets
        .filter(set => set.completed)
        .reduce((best, set) => {
          const currentOneRM = this.calculateOneRepMax(set.weight, set.reps);
          const bestOneRM = this.calculateOneRepMax(best.weight, best.reps);
          return currentOneRM > bestOneRM ? set : best;
        }, latestSession.sets[0]);

      currentBest = {
        weight: bestSet.weight,
        reps: bestSet.reps,
        volume: latestSession.sets.reduce((sum, set) => 
          sum + this.calculateSetVolume(set.weight, set.reps, set.partialReps || 0), 0
        ),
        oneRepMax: this.calculateOneRepMax(bestSet.weight, bestSet.reps)
      };
    }

    // Determine if ready for progression
    const readyForProgression = trend === 'improving' || 
                               (trend === 'plateauing' && weeksSinceProgress >= 1) ||
                               (trend === 'insufficient_data' && history.length > 0);

    return {
      exerciseId,
      exerciseName,
      currentBest,
      trend,
      weeksSinceProgress,
      suggestions,
      readyForProgression
    };
  }
}