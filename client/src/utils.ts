export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function calculateCookingTime(
  baseTime: number,
  defaultWeight: number,
  actualWeight: number,
  timePer100g: number,
  modeMultiplier: number = 1
): number {
  // If no time per 100g (e.g. rice, pasta, eggs), weight doesn't change time (usually)
  // But for roasts/meat, it does.
  
  if (timePer100g === 0) {
    return Math.round(baseTime * modeMultiplier * 60); // in seconds
  }

  // Formula: Base time + ((Actual Weight - Default Weight) / 100) * TimePer100g
  // Note: This is a simplified linear model. 
  // Often it's Base + (Weight/500g)*X or similar.
  // Using the provided logic from data structure:
  
  // Let's assume baseTime is for defaultWeight.
  // Then we add timePer100g for every 100g ABOVE defaultWeight?
  // Or is it Base + (Weight * TimePer100g/100)?
  
  // Let's try: Total Time = BaseTime (fixed start) + (Weight / 100) * TimePer100g
  // If BaseTime is 0, then it's purely weight based.
  // If TimePer100g is 0, it's fixed time.
  
  let timeInMinutes = baseTime;
  
  if (timePer100g > 0) {
    // If baseTime is 0, we assume linear from 0.
    // If baseTime > 0, it might be "Time for first X grams" or "Fixed overhead + variable".
    // Let's assume BaseTime is "Fixed overhead or time for default weight" isn't quite right with the structure.
    
    // Let's interpret: 
    // If I have a 1kg roast (default), time is 15min (base).
    // If I have 1.1kg, I add 1.5min (timePer100g).
    // So: Base + ((Weight - Default) / 100) * TimePer100g
    
    const weightDiff = actualWeight - defaultWeight;
    timeInMinutes += (weightDiff / 100) * timePer100g;
  }
  
  return Math.round(timeInMinutes * modeMultiplier * 60); // Return in seconds
}

export const playNotificationSound = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3'); // Simple bell
  audio.play().catch(e => console.log("Audio play failed (interaction required)", e));
};
