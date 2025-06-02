import { db } from "./server/db";
import { bodyMeasurements, userBodyweight } from "./shared/schema";

async function populateBodyData() {
  const userId = "1455543"; // Your user ID from the logs
  
  // Generate dates for the last 3 months, about 2-3 entries per week
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Add entries on random days (2-3 times per week)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 1 || dayOfWeek === 4 || (dayOfWeek === 6 && Math.random() > 0.5)) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Starting measurements and weight
  let baseWeight = 87; // Starting weight in kg
  let baseChest = 102;
  let baseShoulders = 120;
  let baseWaist = 85;
  let baseAbdomen = 88;
  let baseHips = 95;
  let baseBicepsL = 34;
  let baseBicepsR = 34.5;
  let baseThighL = 58;
  let baseThighR = 58.2;
  let baseBodyFat = 15;
  
  // Simulate gradual improvement over time
  const totalEntries = dates.length;
  
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const progress = i / totalEntries; // 0 to 1 over time
    
    // Add some realistic variation and gradual improvement
    const weightVariation = (Math.random() - 0.5) * 1.5; // ±0.75kg variation
    const measurementVariation = () => (Math.random() - 0.5) * 2; // ±1cm variation
    
    // Simulate gradual muscle gain and fat loss
    const weight = baseWeight + (progress * 1.5) + weightVariation; // slight weight gain from muscle
    const chest = baseChest + (progress * 3) + measurementVariation(); // chest growth
    const shoulders = baseShoulders + (progress * 2.5) + measurementVariation(); // shoulder growth
    const waist = baseWaist - (progress * 4) + measurementVariation(); // waist reduction
    const abdomen = baseAbdomen - (progress * 5) + measurementVariation(); // abdomen reduction
    const hips = baseHips - (progress * 2) + measurementVariation(); // slight hip reduction
    const bicepsL = baseBicepsL + (progress * 2.5) + measurementVariation(); // arm growth
    const bicepsR = baseBicepsR + (progress * 2.5) + measurementVariation(); // arm growth
    const thighL = baseThighL + (progress * 3) + measurementVariation(); // leg growth
    const thighR = baseThighR + (progress * 3) + measurementVariation(); // leg growth
    const bodyFat = baseBodyFat - (progress * 3) + (Math.random() - 0.5); // body fat reduction
    
    // Insert weight entry
    await db.insert(userBodyweight).values({
      userId,
      weight: weight.toFixed(1),
      measurementDate: date,
    });
    
    // Insert body measurements (not every entry has full measurements)
    const hasFullMeasurements = Math.random() > 0.3; // 70% chance of full measurements
    
    if (hasFullMeasurements) {
      const measurements: any = {
        userId,
        date,
        chest: chest.toFixed(1),
        shoulders: shoulders.toFixed(1),
        waist: waist.toFixed(1),
        abdomen: abdomen.toFixed(1),
        hips: hips.toFixed(1),
        bicepsLeft: bicepsL.toFixed(1),
        bicepsRight: bicepsR.toFixed(1),
        thighLeft: thighL.toFixed(1),
        thighRight: thighR.toFixed(1),
        bodyFatPercentage: Math.max(8, bodyFat).toFixed(1), // Don't go below 8%
      };
      
      // Sometimes add notes
      if (Math.random() > 0.7) {
        const notes = [
          "Feeling strong today",
          "Post-workout measurement",
          "Morning measurement",
          "After rest day",
          "Great progress this week",
          "Consistent training paying off",
          "New personal best in gym",
        ];
        measurements.notes = notes[Math.floor(Math.random() * notes.length)];
      }
      
      await db.insert(bodyMeasurements).values(measurements);
    }
    
    console.log(`Added entry for ${date}`);
  }
  
  console.log(`Successfully populated ${dates.length} entries over 3 months`);
}

populateBodyData()
  .then(() => {
    console.log("Body data population completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error populating body data:", error);
    process.exit(1);
  });