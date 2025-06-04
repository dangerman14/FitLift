/**
 * Progressive overload calculation logic for intelligent workout suggestions
 */

export interface PreviousSetData {
  weight: number;
  reps: number;
  setNumber: number;
}

export interface ProgressionSuggestion {
  weight: number;
  reps: number;
  reasoning: string;
  isProgression: boolean;
}

export interface ExerciseTargets {
  minReps?: number;
  maxReps?: number;
  weightTarget?: number;
}

export class ProgressiveOverloadCalculator {
  /**
   * Calculate progressive overload suggestion based on previous performance
   */
  static calculateProgression(
    previousSets: PreviousSetData[],
    targets?: ExerciseTargets,
    weightIncrement: number = 2.5
  ): ProgressionSuggestion {
    if (!previousSets || previousSets.length === 0) {
      return {
        weight: targets?.weightTarget || 0,
        reps: targets?.minReps || 8,
        reasoning: "Starting values based on targets",
        isProgression: false
      };
    }

    // Find the best performing set (highest weight, or highest reps if same weight)
    const bestSet = previousSets.reduce((best, current) => {
      if (current.weight > best.weight) return current;
      if (current.weight === best.weight && current.reps > best.reps) return current;
      return best;
    });

    const { weight: lastWeight, reps: lastReps } = bestSet;
    const minReps = targets?.minReps || 6;
    const maxReps = targets?.maxReps || 12;

    // Progressive overload logic
    if (lastReps >= maxReps) {
      // At upper limit of rep range - increase weight, drop reps to lower range
      const newWeight = lastWeight + weightIncrement;
      const newReps = Math.max(minReps, lastReps - 3);
      
      return {
        weight: newWeight,
        reps: newReps,
        reasoning: `Hit upper rep range (${lastReps}/${maxReps}) - increase weight`,
        isProgression: true
      };
    } else if (lastReps >= minReps && lastReps < maxReps) {
      // Within rep range - conservative increase of 1 rep
      const repsIncrease = 1;
      const newReps = Math.min(maxReps, lastReps + repsIncrease);
      
      return {
        weight: lastWeight,
        reps: newReps,
        reasoning: `Add ${repsIncrease} rep within range`,
        isProgression: true
      };
    } else {
      // Below rep range - conservative build up to minimum reps
      const newReps = Math.min(minReps, lastReps + 1);
      
      return {
        weight: lastWeight,
        reps: newReps,
        reasoning: `Build up to minimum rep range (${minReps})`,
        isProgression: true
      };
    }
  }

  /**
   * Calculate progression for bodyweight exercises
   */
  static calculateBodyweightProgression(
    previousSets: PreviousSetData[],
    targets?: ExerciseTargets
  ): ProgressionSuggestion {
    if (!previousSets || previousSets.length === 0) {
      return {
        weight: 0,
        reps: targets?.minReps || 5,
        reasoning: "Starting bodyweight progression",
        isProgression: false
      };
    }

    const bestSet = previousSets.reduce((best, current) => 
      current.reps > best.reps ? current : best
    );

    const { reps: lastReps } = bestSet;
    const minReps = targets?.minReps || 5;
    const maxReps = targets?.maxReps || 20;

    if (lastReps >= maxReps) {
      // Consider adding weight or progressing to harder variation
      return {
        weight: 0,
        reps: lastReps,
        reasoning: `Consider progression to harder variation or add weight`,
        isProgression: true
      };
    } else {
      // Conservative bodyweight progression - add 1 rep
      const repsIncrease = 1;
      const newReps = Math.min(maxReps, lastReps + repsIncrease);
      
      return {
        weight: 0,
        reps: newReps,
        reasoning: `Add ${repsIncrease} rep for bodyweight progression`,
        isProgression: true
      };
    }
  }

  /**
   * Get weight increment based on exercise type and current weight
   */
  static getWeightIncrement(exerciseType: string, currentWeight: number): number {
    // Smaller increments for isolation exercises and upper body
    const smallIncrementExercises = [
      'bicep curl', 'tricep', 'lateral raise', 'rear delt',
      'calf raise', 'wrist curl', 'face pull'
    ];

    const isSmallIncrement = smallIncrementExercises.some(type => 
      exerciseType.toLowerCase().includes(type)
    );

    if (isSmallIncrement || currentWeight < 20) {
      return 1.25; // Smaller increments for light weights and isolation
    } else if (currentWeight < 50) {
      return 2.5; // Standard increment for moderate weights
    } else {
      return 5; // Larger increments for heavy compound movements
    }
  }

  /**
   * Format suggestion for display
   */
  static formatSuggestion(suggestion: ProgressionSuggestion, weightUnit: string = 'kg'): string {
    if (suggestion.weight > 0) {
      return `${suggestion.weight}${weightUnit} × ${suggestion.reps}`;
    } else {
      return `${suggestion.reps} reps`;
    }
  }

  /**
   * Get progression indicator icon
   */
  static getProgressionIcon(suggestion: ProgressionSuggestion): string {
    if (!suggestion.isProgression) return '';
    
    if (suggestion.reasoning.includes('increase weight')) {
      return '⬆️'; // Weight increase
    } else if (suggestion.reasoning.includes('rep')) {
      return '📈'; // Rep increase
    } else {
      return '🎯'; // General progression
    }
  }
}