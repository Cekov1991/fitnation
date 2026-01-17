# Backend API Requirements for Modal Components

This document specifies exactly what data is needed from the backend API to populate all three modal components with real data instead of dummy values.

---

## 1. Strength Score Modal (`StrengthScoreModal.tsx`)

### Current Dummy Data Being Displayed:
- **Main Score:** `85`
- **Level Badge:** `EXCELLENT` (green)
- **Recent Change:** `+5%`
- **Ranking:** `Top 15%`
- **Description:** Mentions "strength score of 85" and "top 15%"
- **Muscle Groups:**
  - Chest: 88
  - Back: 85
  - Legs: 82
  - Shoulders: 86
  - Arms: 84

### Required Backend Fields:

#### From `strength_score` object:
```typescript
strength_score: {
  current: number;              // ✅ Already exists - Main strength score (e.g., 85)
  level: StrengthLevel;         // ✅ Already exists - 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  recent_gain: number;          // ✅ Already exists - Recent gain (e.g., 5)
  gain_period: 'last_30_days'; // ✅ Already exists
  
  // ❌ MISSING - Need to add:
  percentile?: number;          // Percentile ranking (0-100), e.g., 85 means top 15%
  // OR
  ranking?: string;             // Pre-formatted ranking string, e.g., "Top 15%"
  
  // ❌ MISSING - Need to add:
  muscle_groups?: {             // Strength scores by muscle group
    chest?: number;             // e.g., 88
    back?: number;              // e.g., 85
    legs?: number;              // e.g., 82
    shoulders?: number;         // e.g., 86
    arms?: number;              // e.g., 84
    // Can include more specific groups if available
  };
}
```

**Notes:**
- `percentile` should be calculated based on user demographics (age, gender, training experience)
- If `percentile` is 85, frontend will display as "Top 15%" (100 - 85 = 15)
- `muscle_groups` should contain strength scores (0-100 scale) for each major muscle group
- Level badge color logic: ADVANCED = green, INTERMEDIATE = blue, BEGINNER = yellow

---

## 2. Balance Modal (`BalanceModal.tsx`)

### Current Dummy Data Being Displayed:
- **Main Balance Score:** `75%`
- **Level Badge:** `GOOD` (green)
- **Recent Change:** `+3%`
- **Status:** `GOOD`
- **Description:** Mentions "strength balance of 75%" and "good muscle group distribution"
- **Muscle Group Distribution:**
  - Chest: 18%
  - Back: 20%
  - Legs: 22%
  - Shoulders: 15%
  - Arms: 15%
  - Core: 10%

### Required Backend Fields:

#### From `strength_balance` object:
```typescript
strength_balance: {
  percentage: number;           // ✅ Already exists - Overall balance (0-100), e.g., 75
  level: BalanceLevel;          // ✅ Already exists - 'EXCELLENT' | 'GOOD' | 'FAIR' | 'NEEDS_IMPROVEMENT'
  recent_change: number;        // ✅ Already exists - Recent change percentage, e.g., 3
  muscle_groups: Record<string, number>; // ✅ Already exists - Distribution percentages
  
  // Note: The existing muscle_groups field should contain:
  // {
  //   "chest": 18,
  //   "back": 20,
  //   "legs": 22,
  //   "shoulders": 15,
  //   "arms": 15,
  //   "core": 10,
  //   // ... other muscle groups
  // }
}
```

**Notes:**
- The `muscle_groups` field already exists and should contain percentage distribution (0-100) for each muscle group
- These percentages should sum to approximately 100% across all muscle groups
- Level badge color logic: EXCELLENT = green, GOOD = green/blue, FAIR = yellow, NEEDS_IMPROVEMENT = red
- Recent change can be positive or negative

---

## 3. Weekly Progress Modal (`WeeklyProgressModal.tsx`)

### Current Dummy Data Being Displayed:
- **Main Progress:** `+12%` vs Last Week
- **Status Badge:** `IMPROVING` (green)
- **Stats Grid:**
  - Workouts: `4`
  - Volume (lbs): `12k` (12,000)`
  - Total Time: `3.2h`
- **Weekly Volume Chart:** Line chart showing daily volume:
  - Mon: 2400 lbs, 1 workout
  - Tue: 0 lbs, 0 workouts
  - Wed: 3200 lbs, 1 workout
  - Thu: 0 lbs, 0 workouts
  - Fri: 2800 lbs, 1 workout
  - Sat: 3600 lbs, 1 workout
  - Sun: 0 lbs, 0 workouts
- **Daily Breakdown:** List of each day with volume and workout indicator
- **Comparison Section:**
  - This Week: `12,000 lbs`
  - Last Week: `10,714 lbs`
  - Difference: `+1,286 lbs (+12%)`

### Required Backend Fields:

#### From `weekly_progress` object:
```typescript
weekly_progress: {
  percentage: number;                    // ✅ Already exists - Percentage change (e.g., 12)
  trend: TrendDirection;                 // ✅ Already exists - 'up' | 'down' | 'same'
  current_week_workouts: number;        // ✅ Already exists - Workout count (e.g., 4)
  previous_week_workouts: number;        // ✅ Already exists - Previous week count
  
  // ❌ MISSING - Need to add:
  current_week_volume?: number;          // Total volume in lbs for current week (e.g., 12000)
  current_week_time_minutes?: number;    // Total time in minutes (e.g., 192 = 3.2h)
  
  // ❌ MISSING - Need to add:
  daily_breakdown?: Array<{             // Daily data for the current week
    day_of_week: number;                // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    date: string;                       // ISO date string (e.g., "2024-01-15")
    volume: number;                     // Volume in lbs for that day (e.g., 2400)
    workouts: number;                    // Number of workouts (e.g., 1)
    time_minutes?: number;               // Optional: Time spent in minutes
  }>;
  
  // ❌ MISSING - Need to add:
  previous_week_volume?: number;         // Total volume for previous week (e.g., 10714)
  
  // ❌ MISSING - Need to add:
  volume_difference?: number;            // Difference in volume (e.g., 1286)
  volume_difference_percent?: number;    // Percentage difference (e.g., 12)
}
```

**Notes:**
- `daily_breakdown` should contain 7 entries (one for each day of the week)
- Days with no workouts should have `volume: 0` and `workouts: 0`
- Volume should be calculated as total weight lifted (sum of all sets: weight × reps)
- Time should be total workout duration in minutes
- The chart uses `daily_breakdown` to plot the line graph
- Status badge: trend 'up' = IMPROVING (green), 'down' = DECLINING (red), 'same' = STEADY (blue)

---

## Summary of Missing Fields

### High Priority (Required for Full Functionality):

1. **Strength Score Modal:**
   - `strength_score.percentile` or `strength_score.ranking` - For "Top X%" display
   - `strength_score.muscle_groups` - For "Strength by Muscle Group" section

2. **Weekly Progress Modal:**
   - `weekly_progress.current_week_volume` - For volume stat card
   - `weekly_progress.current_week_time_minutes` - For time stat card
   - `weekly_progress.daily_breakdown` - For chart and daily breakdown section
   - `weekly_progress.previous_week_volume` - For comparison section
   - `weekly_progress.volume_difference` - For comparison section
   - `weekly_progress.volume_difference_percent` - For comparison section

### Already Available (No Changes Needed):

- **Balance Modal:** All required fields already exist in the API
- **Strength Score Modal:** Basic fields (current, level, recent_gain) already exist
- **Weekly Progress Modal:** Basic fields (percentage, trend, workout counts) already exist

---

## Example Complete API Response

```json
{
  "strength_score": {
    "current": 85,
    "level": "ADVANCED",
    "recent_gain": 5,
    "gain_period": "last_30_days",
    "percentile": 85,
    "muscle_groups": {
      "chest": 88,
      "back": 85,
      "legs": 82,
      "shoulders": 86,
      "arms": 84
    }
  },
  "strength_balance": {
    "percentage": 75,
    "level": "GOOD",
    "recent_change": 3,
    "muscle_groups": {
      "chest": 18,
      "back": 20,
      "legs": 22,
      "shoulders": 15,
      "arms": 15,
      "core": 10
    }
  },
  "weekly_progress": {
    "percentage": 12,
    "trend": "up",
    "current_week_workouts": 4,
    "previous_week_workouts": 3,
    "current_week_volume": 12000,
    "current_week_time_minutes": 192,
    "previous_week_volume": 10714,
    "volume_difference": 1286,
    "volume_difference_percent": 12,
    "daily_breakdown": [
      {
        "day_of_week": 0,
        "date": "2024-01-15",
        "volume": 2400,
        "workouts": 1,
        "time_minutes": 45
      },
      {
        "day_of_week": 1,
        "date": "2024-01-16",
        "volume": 0,
        "workouts": 0,
        "time_minutes": 0
      },
      {
        "day_of_week": 2,
        "date": "2024-01-17",
        "volume": 3200,
        "workouts": 1,
        "time_minutes": 60
      },
      {
        "day_of_week": 3,
        "date": "2024-01-18",
        "volume": 0,
        "workouts": 0,
        "time_minutes": 0
      },
      {
        "day_of_week": 4,
        "date": "2024-01-19",
        "volume": 2800,
        "workouts": 1,
        "time_minutes": 50
      },
      {
        "day_of_week": 5,
        "date": "2024-01-20",
        "volume": 3600,
        "workouts": 1,
        "time_minutes": 70
      },
      {
        "day_of_week": 6,
        "date": "2024-01-21",
        "volume": 0,
        "workouts": 0,
        "time_minutes": 0
      }
    ]
  }
}
```

---

## Implementation Notes

1. **Backward Compatibility:** All new fields should be optional (`?`) so the frontend can gracefully handle missing data
2. **Data Calculation:**
   - Volume = Sum of (weight × reps) for all sets in all workouts
   - Percentile = Calculated based on user demographics comparison
   - Muscle group scores = Calculated from exercise performance data
3. **Time Formatting:** Frontend will convert minutes to hours (e.g., 192 minutes = 3.2h)
4. **Volume Formatting:** Frontend will format large numbers (e.g., 12000 = "12k")
