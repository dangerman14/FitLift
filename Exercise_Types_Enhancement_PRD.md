# Exercise Types Enhancement - Product Requirements Document

## 1. Executive Summary

### Feature Overview
Expand the current fitness tracking application to support multiple exercise types beyond the traditional weight and reps format. This enhancement will enable users to track duration-based exercises, distance activities, and bodyweight movements with proper calculations that account for user body weight.

### Current State
- **Existing**: Weight + Reps tracking (e.g., Bench Press: 185 lbs x 10 reps)
- **Enhancement**: Multiple exercise types with specialized tracking and calculations

### Business Value
- Broader appeal to different fitness communities (runners, yogis, bodyweight enthusiasts)
- More comprehensive fitness tracking capabilities
- Enhanced user engagement through diverse workout options
- Competitive advantage over single-format fitness apps

## 2. Exercise Type Specifications

### 2.1 Duration-Based Exercises
**Use Cases**: Planks, yoga poses, stretching, meditation
**Data Structure**:
```
- Exercise Name
- Duration (seconds/minutes)
- Difficulty Level (optional)
- Notes
```
**Example**: Plank hold for 60 seconds

### 2.2 Duration + Weight Exercises
**Use Cases**: Weighted planks, weighted wall sits, loaded carries with time
**Data Structure**:
```
- Exercise Name
- Duration (seconds/minutes)
- Weight (lbs/kg)
- Notes
```
**Example**: Weighted plank with 25 lbs for 45 seconds

### 2.3 Distance + Duration Exercises
**Use Cases**: Running, cycling, rowing, swimming
**Data Structure**:
```
- Exercise Name
- Distance (miles/km)
- Duration (minutes:seconds)
- Pace (calculated: duration/distance)
- Notes
```
**Example**: 5K run in 24:30 (7:52/mile pace)

### 2.4 Weight + Distance Exercises
**Use Cases**: Farmer's walks, suitcase carries, sled pushes
**Data Structure**:
```
- Exercise Name
- Weight (lbs/kg)
- Distance (feet/meters)
- Duration (optional)
- Notes
```
**Example**: Farmer's walk with 50 lbs each hand for 100 feet

### 2.5 Bodyweight Exercise System
**Categories**:
- **Bodyweight**: Standard bodyweight movements
- **Assisted Bodyweight**: Reduced effective weight (bands, machine assistance)
- **Weighted Bodyweight**: Added external weight

**Data Structure**:
```
- Exercise Name
- User Bodyweight (tracked over time)
- External Weight (if applicable, can be negative for assistance)
- Reps
- Effective Weight (calculated)
```

**Calculations**:
- **Standard Bodyweight**: Effective Weight = User Bodyweight
- **Assisted**: Effective Weight = User Bodyweight - Assistance Amount
- **Weighted**: Effective Weight = User Bodyweight + Added Weight

**Examples**:
- Pull-ups: 180 lbs bodyweight x 8 reps = 1,440 lbs total volume
- Assisted pull-ups: (180 lbs - 30 lbs assistance) x 10 reps = 1,500 lbs total volume
- Weighted dips: (180 lbs + 25 lbs) x 6 reps = 1,230 lbs total volume

## 3. Database Schema Changes

### 3.1 Enhanced Exercise Types
```sql
-- Add exercise type enumeration
ALTER TABLE exercises ADD COLUMN exercise_type VARCHAR(50) DEFAULT 'weight_reps';

-- Possible values:
-- 'weight_reps' (existing)
-- 'duration'
-- 'duration_weight'
-- 'distance_duration'
-- 'weight_distance'
-- 'bodyweight'
-- 'assisted_bodyweight'
-- 'weighted_bodyweight'
```

### 3.2 User Bodyweight Tracking
```sql
-- New table for bodyweight history
CREATE TABLE user_bodyweight (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  weight DECIMAL(6,2) NOT NULL,
  measurement_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, measurement_date)
);

-- Add current bodyweight to users table
ALTER TABLE users ADD COLUMN current_bodyweight DECIMAL(6,2);
```

### 3.3 Enhanced Exercise Sets
```sql
-- Extend exercise_sets table
ALTER TABLE exercise_sets ADD COLUMN duration INTEGER; -- seconds
ALTER TABLE exercise_sets ADD COLUMN distance DECIMAL(8,2); -- miles/km
ALTER TABLE exercise_sets ADD COLUMN assistance_weight DECIMAL(6,2); -- for assisted exercises
ALTER TABLE exercise_sets ADD COLUMN pace DECIMAL(6,2); -- calculated pace
ALTER TABLE exercise_sets ADD COLUMN effective_weight DECIMAL(8,2); -- calculated total weight
```

### 3.4 Exercise Metadata
```sql
-- Add tracking preferences to exercises
ALTER TABLE exercises ADD COLUMN default_duration_unit VARCHAR(10) DEFAULT 'seconds'; -- seconds, minutes
ALTER TABLE exercises ADD COLUMN default_distance_unit VARCHAR(10) DEFAULT 'miles'; -- miles, km, feet, meters
ALTER TABLE exercises ADD COLUMN requires_bodyweight BOOLEAN DEFAULT FALSE;
```

## 4. User Interface Design

### 4.1 Exercise Creation/Editing
**Enhanced Exercise Form**:
- Exercise Type Selector (dropdown)
- Dynamic form fields based on selected type
- Unit preferences per exercise
- Default values and suggestions

### 4.2 Workout Session Interface
**Type-Specific Input Forms**:

**Duration Exercises**:
```
[Exercise Name]
Duration: [MM:SS] timer with start/stop functionality
Difficulty: [1-10 scale]
```

**Distance + Duration**:
```
[Exercise Name]
Distance: [___] [miles/km]
Time: [MM:SS] with timer
Pace: [auto-calculated]
```

**Bodyweight Exercises**:
```
[Exercise Name]
Bodyweight: [180] lbs (from profile)
Assistance: [-] [30] lbs (optional)
Added Weight: [+] [25] lbs (optional)
Reps: [___]
Effective Weight: [175] lbs (calculated)
```

### 4.3 Progress Tracking Adaptations
**Type-Specific Metrics**:
- **Duration**: Best time, average time, progression over sessions
- **Distance**: Best pace, distance PRs, endurance improvements
- **Bodyweight**: Strength-to-weight ratios, progression accounting for weight changes

## 5. Technical Implementation

### 5.1 Database Layer (Drizzle Schema)
```typescript
// Enhanced exercise types
export const exerciseTypes = [
  'weight_reps',
  'duration', 
  'duration_weight',
  'distance_duration',
  'weight_distance',
  'bodyweight',
  'assisted_bodyweight', 
  'weighted_bodyweight'
] as const;

// User bodyweight tracking
export const userBodyweight = pgTable("user_bodyweight", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  weight: decimal("weight", { precision: 6, scale: 2 }).notNull(),
  measurementDate: date("measurement_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced exercise sets
export const exerciseSets = pgTable("exercise_sets", {
  // ... existing fields
  duration: integer("duration"), // seconds
  distance: decimal("distance", { precision: 8, scale: 2 }),
  assistanceWeight: decimal("assistance_weight", { precision: 6, scale: 2 }),
  pace: decimal("pace", { precision: 6, scale: 2 }),
  effectiveWeight: decimal("effective_weight", { precision: 8, scale: 2 }),
});
```

### 5.2 Business Logic Layer
```typescript
// Exercise type calculations
export class ExerciseCalculations {
  static calculateEffectiveWeight(
    exerciseType: string,
    userBodyweight: number,
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
      default:
        return externalWeight;
    }
  }

  static calculatePace(distance: number, duration: number): number {
    return duration / distance; // minutes per mile/km
  }

  static calculateVolume(
    exerciseType: string,
    weight: number,
    reps: number,
    distance: number,
    duration: number
  ): number {
    switch (exerciseType) {
      case 'weight_reps':
      case 'bodyweight':
      case 'assisted_bodyweight':
      case 'weighted_bodyweight':
        return weight * reps;
      case 'weight_distance':
        return weight * distance;
      default:
        return 0;
    }
  }
}
```

### 5.3 Frontend Components
```typescript
// Type-specific input components
export const DurationInput = ({ value, onChange }) => {
  // Timer interface with start/stop
  // MM:SS input format
  // Live timer during workout
};

export const DistanceDurationInput = ({ distance, duration, onChange }) => {
  // Distance input with unit selection
  // Duration timer
  // Auto-calculated pace display
};

export const BodyweightInput = ({ userBodyweight, assistance, added, onChange }) => {
  // Bodyweight display (from profile)
  // Optional assistance weight (negative)
  // Optional added weight (positive)
  // Calculated effective weight display
};
```

## 6. User Experience Flows

### 6.1 Bodyweight Setup Flow
1. **Profile Setup**: User enters current bodyweight in profile
2. **Weight Tracking**: Regular bodyweight updates (manual or device sync)
3. **Exercise Selection**: System automatically uses current bodyweight for calculations
4. **Workout Tracking**: Real-time effective weight calculations during sets

### 6.2 Exercise Type Selection Flow
1. **Exercise Creation**: User selects exercise type from dropdown
2. **Dynamic Form**: Form adapts to show relevant input fields
3. **Default Settings**: System suggests appropriate units and formats
4. **Validation**: Type-specific validation rules applied

### 6.3 Progress Analysis Flow
1. **Type-Aware Analytics**: Charts and metrics adapt to exercise type
2. **Comparative Analysis**: Progress tracking accounts for bodyweight changes
3. **Personal Records**: Type-specific PR detection and celebration

## 7. Migration Strategy

### 7.1 Database Migration
```sql
-- Phase 1: Add new columns with defaults
ALTER TABLE exercises ADD COLUMN exercise_type VARCHAR(50) DEFAULT 'weight_reps';
ALTER TABLE exercise_sets ADD COLUMN duration INTEGER;
-- ... other columns

-- Phase 2: Migrate existing data
UPDATE exercises SET exercise_type = 'weight_reps' WHERE exercise_type IS NULL;

-- Phase 3: Add constraints and validation
ALTER TABLE exercises ALTER COLUMN exercise_type SET NOT NULL;
```

### 7.2 Application Migration
1. **Backward Compatibility**: Existing workouts continue working normally
2. **Gradual Rollout**: New exercise types available for new exercises
3. **User Education**: In-app guidance for new features

## 8. Success Metrics

### 8.1 User Engagement
- Adoption rate of new exercise types
- Diversity of workout types per user
- Session duration for different exercise types

### 8.2 Feature Usage
- Most popular new exercise types
- Bodyweight tracking participation rate
- Progression tracking engagement

## 9. Future Enhancements

### 9.1 Device Integration
- Smart scale integration for automatic bodyweight updates
- Fitness tracker sync for duration and distance exercises
- Heart rate monitoring during duration-based exercises

### 9.2 Advanced Analytics
- Strength-to-weight ratio tracking
- Endurance progression analysis
- Cross-training performance correlations

## 10. Implementation Timeline

### Phase 1 (Weeks 1-2): Database & Backend
- Database schema updates
- Business logic implementation
- API endpoint modifications

### Phase 2 (Weeks 3-4): Frontend Components
- Type-specific input components
- Enhanced exercise creation interface
- Workout session UI updates

### Phase 3 (Weeks 5-6): Integration & Testing
- End-to-end testing
- Data migration scripts
- User acceptance testing

### Phase 4 (Week 7): Deployment & Documentation
- Production deployment
- User documentation
- Feature announcement

---

*This PRD outlines a comprehensive enhancement to support diverse exercise types while maintaining the robust foundation of the existing fitness tracking application.*