import { ExerciseType } from './schema';

/**
 * Business logic for exercise calculations across different exercise types
 */
export class ExerciseCalculations {
  /**
   * Calculate effective weight for bodyweight exercises
   */
  static calculateEffectiveWeight(
    exerciseType: ExerciseType,
    userBodyweight: number = 0,
    externalWeight: number = 0,
    assistanceWeight: number = 0
  ): number {
    switch (exerciseType) {
      case 'bodyweight':
        return userBodyweight;
      case 'assisted_bodyweight':
        return userBodyweight - assistanceWeight;
      case 'weighted_bodyweight':
        return userBodyweight + externalWeight;
      case 'weight_reps':
      case 'duration_weight':
      case 'weight_distance':
        return externalWeight;
      default:
        return 0; // Duration and distance exercises don't have weight
    }
  }

  /**
   * Calculate pace for distance + duration exercises
   */
  static calculatePace(distance: number, durationInSeconds: number): number {
    if (distance <= 0) return 0;
    const durationInMinutes = durationInSeconds / 60;
    return durationInMinutes / distance; // minutes per mile/km
  }

  /**
   * Calculate volume based on exercise type
   */
  static calculateVolume(
    exerciseType: ExerciseType,
    weight: number = 0,
    reps: number = 0,
    distance: number = 0,
    duration: number = 0,
    userBodyweight: number = 0,
    assistanceWeight: number = 0
  ): number {
    switch (exerciseType) {
      case 'weight_reps':
        return weight * reps;
      case 'bodyweight':
      case 'assisted_bodyweight':
      case 'weighted_bodyweight':
        const effectiveWeight = this.calculateEffectiveWeight(
          exerciseType, 
          userBodyweight, 
          weight, 
          assistanceWeight
        );
        return effectiveWeight * reps;
      case 'weight_distance':
        return weight * distance;
      case 'duration':
      case 'duration_weight':
        return duration; // Volume = time in seconds
      case 'distance_duration':
        return distance; // Volume = distance covered
      default:
        return 0;
    }
  }

  /**
   * Format duration for display (seconds to MM:SS)
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Parse duration from MM:SS format to seconds
   */
  static parseDuration(duration: string): number {
    const parts = duration.split(':');
    if (parts.length !== 2) return 0;
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }

  /**
   * Format pace for display
   */
  static formatPace(paceMinutesPerUnit: number, unit: 'miles' | 'km' = 'miles'): string {
    const minutes = Math.floor(paceMinutesPerUnit);
    const seconds = Math.round((paceMinutesPerUnit - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /${unit === 'miles' ? 'mi' : 'km'}`;
  }

  /**
   * Get required input fields for an exercise type
   */
  static getRequiredFields(exerciseType: ExerciseType): {
    weight: boolean;
    reps: boolean;
    duration: boolean;
    distance: boolean;
    bodyweight: boolean;
    assistance: boolean;
  } {
    const fields = {
      weight: false,
      reps: false,
      duration: false,
      distance: false,
      bodyweight: false,
      assistance: false,
    };

    switch (exerciseType) {
      case 'weight_reps':
        fields.weight = true;
        fields.reps = true;
        break;
      case 'duration':
        fields.duration = true;
        break;
      case 'duration_weight':
        fields.duration = true;
        fields.weight = true;
        break;
      case 'distance_duration':
        fields.distance = true;
        fields.duration = true;
        break;
      case 'weight_distance':
        fields.weight = true;
        fields.distance = true;
        break;
      case 'bodyweight':
        fields.bodyweight = true;
        fields.reps = true;
        break;
      case 'assisted_bodyweight':
        fields.bodyweight = true;
        fields.reps = true;
        fields.assistance = true;
        break;
      case 'weighted_bodyweight':
        fields.bodyweight = true;
        fields.reps = true;
        fields.weight = true;
        break;
    }

    return fields;
  }

  /**
   * Get unit suggestions for an exercise type
   */
  static getUnitSuggestions(exerciseType: ExerciseType): {
    weight?: string[];
    distance?: string[];
    duration?: string[];
  } {
    const suggestions: any = {};

    if (['weight_reps', 'duration_weight', 'weight_distance', 'weighted_bodyweight'].includes(exerciseType)) {
      suggestions.weight = ['lbs', 'kg'];
    }

    if (['distance_duration', 'weight_distance'].includes(exerciseType)) {
      suggestions.distance = ['miles', 'km', 'feet', 'meters'];
    }

    if (['duration', 'duration_weight', 'distance_duration'].includes(exerciseType)) {
      suggestions.duration = ['seconds', 'minutes'];
    }

    if (['assisted_bodyweight'].includes(exerciseType)) {
      suggestions.assistance = ['lbs', 'kg'];
    }

    return suggestions;
  }

  /**
   * Validate exercise set data based on exercise type
   */
  static validateSetData(
    exerciseType: ExerciseType,
    data: {
      weight?: number;
      reps?: number;
      duration?: number;
      distance?: number;
      assistanceWeight?: number;
    }
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const required = this.getRequiredFields(exerciseType);

    if (required.weight && (!data.weight || data.weight <= 0)) {
      errors.push('Weight is required and must be greater than 0');
    }

    if (required.reps && (!data.reps || data.reps <= 0)) {
      errors.push('Reps is required and must be greater than 0');
    }

    if (required.duration && (!data.duration || data.duration <= 0)) {
      errors.push('Duration is required and must be greater than 0');
    }

    if (required.distance && (!data.distance || data.distance <= 0)) {
      errors.push('Distance is required and must be greater than 0');
    }

    if (required.assistance && (!data.assistanceWeight || data.assistanceWeight <= 0)) {
      errors.push('Assistance weight is required and must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}