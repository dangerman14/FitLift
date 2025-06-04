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
   * Get muscle group specific rep ranges for optimal strength training
   */
  static getMuscleGroupRepRange(muscleGroups: string[]): { minReps: number; maxReps: number } {
    const primaryMuscle = muscleGroups[0]?.toLowerCase() || '';
    
    // Strength-focused rep ranges by muscle group
    const repRanges = {
      // Large compound movements - lower reps for strength
      'quadriceps': { minReps: 6, maxReps: 10 },
      'glutes': { minReps: 6, maxReps: 12 },
      'hamstrings': { minReps: 6, maxReps: 12 },
      
      // Upper body compound - moderate reps
      'chest': { minReps: 6, maxReps: 12 },
      'back': { minReps: 6, maxReps: 12 },
      'lats': { minReps: 6, maxReps: 12 },
      'shoulders': { minReps: 6, maxReps: 12 },
      
      // Smaller muscle groups - slightly higher reps
      'biceps': { minReps: 8, maxReps: 15 },
      'triceps': { minReps: 8, maxReps: 15 },
      'calves': { minReps: 10, maxReps: 15 },
      'forearms': { minReps: 10, maxReps: 15 },
      
      // Core and stabilizers - higher reps
      'abs': { minReps: 10, maxReps: 20 },
      'core': { minReps: 10, maxReps: 20 },
      
      // Default for unknown muscle groups
      'default': { minReps: 6, maxReps: 12 }
    };
    
    return (repRanges as any)[primaryMuscle] || repRanges['default'];
  }

  /**
   * Calculate progressive overload suggestion based on previous performance
   */
  static calculateProgression(
    previousSets: PreviousSetData[],
    targets?: ExerciseTargets,
    weightIncrement: number = 2.5,
    exerciseMuscleGroups: string[] = []
  ): ProgressionSuggestion {
    if (!previousSets || previousSets.length === 0) {
      return {
        weight: targets?.weightTarget || 0,
        reps: targets?.minReps || 8,
        reasoning: "Starting values based on targets",
        isProgression: false
      };
    }

    // Filter and validate data with conservative approach
    const validSets = previousSets.filter(set => {
      // Basic validation
      if (set.reps <= 0 || set.weight <= 0 || set.reps > 30 || set.weight > 150) {
        return false;
      }
      
      // Filter out data entry errors where reps equals weight
      if (set.reps === set.weight) {
        return false;
      }
      
      // Conservative weight/rep validation - filter out extreme outliers
      if (set.weight > 80) {
        return false; // Most isolation exercises shouldn't exceed 80kg for typical users
      }
      
      if (set.weight < 5 && set.reps < 5) {
        return false; // Very light weights with very low reps are suspicious
      }
      
      return true;
    });

    // If no valid data, use typical starting values
    if (validSets.length === 0) {
      const startWeight = targets?.weightTarget || 20; // Conservative starting weight
      return {
        weight: startWeight,
        reps: targets?.minReps || 8,
        reasoning: "Starting with conservative baseline values",
        isProgression: false
      };
    }

    // Use only the most recent valid sets (last 5) for progression calculation
    const recentSets = validSets.slice(0, 5);

    // Find the best performing set from recent data (highest weight, or highest reps if same weight)
    const bestSet = recentSets.reduce((best, current) => {
      if (current.weight > best.weight) return current;
      if (current.weight === best.weight && current.reps > best.reps) return current;
      return best;
    });

    // Ensure weight and reps are treated as numbers (handle potential string data from DB)
    const lastWeight = Number(bestSet.weight) || 0;
    const lastReps = Number(bestSet.reps) || 0;
    
    // Use muscle group-specific rep ranges if no targets provided or if targets are unrealistic
    const muscleGroupRange = this.getMuscleGroupRepRange(exerciseMuscleGroups);
    const minReps = targets?.minReps && targets.minReps <= muscleGroupRange.maxReps ? targets.minReps : muscleGroupRange.minReps;
    const maxReps = targets?.maxReps && targets.maxReps <= muscleGroupRange.maxReps ? targets.maxReps : muscleGroupRange.maxReps;

    // Progressive overload logic
    if (lastReps >= maxReps) {
      // At upper limit of rep range - increase weight, drop reps to lower range
      const newWeight = Math.round((lastWeight + weightIncrement) * 4) / 4; // Round to nearest 0.25
      const newReps = Math.max(minReps, Math.min(minReps + 2, lastReps - 2));
      
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
      'calf raise', 'wrist curl', 'face pull', 'curl', 'fly'
    ];

    const isSmallIncrement = smallIncrementExercises.some(type => 
      exerciseType.toLowerCase().includes(type)
    );

    // More conservative increments across the board
    if (isSmallIncrement || currentWeight < 30) {
      return 1.25; // Very small increments for isolation and light weights
    } else if (currentWeight < 60) {
      return 2.5; // Standard increment for moderate weights
    } else if (currentWeight < 100) {
      return 2.5; // Keep standard increment for most weights
    } else {
      return 5; // Only use larger increments for very heavy weights
    }
  }

  /**
   * Format weight to remove unnecessary decimal places
   */
  static formatWeight(weight: number): number {
    // Round to nearest 0.25 for practical gym weights
    const rounded = Math.round(weight * 4) / 4;
    // Return clean number without unnecessary decimals
    return parseFloat(rounded.toFixed(2));
  }

  /**
   * Format suggestion for display
   */
  static formatSuggestion(suggestion: ProgressionSuggestion, weightUnit: string = 'kg'): string {
    if (suggestion.weight > 0) {
      // Clean up weight display - remove unnecessary decimals
      let cleanWeight = suggestion.weight;
      if (cleanWeight % 1 === 0) {
        cleanWeight = Math.round(cleanWeight);
      } else if (Math.abs(cleanWeight - Math.round(cleanWeight * 4) / 4) < 0.01) {
        cleanWeight = Math.round(cleanWeight * 4) / 4;
      } else {
        cleanWeight = Math.round(cleanWeight * 10) / 10;
      }
      return `${cleanWeight}${weightUnit} × ${suggestion.reps}`;
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