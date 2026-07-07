import { AppSettings } from "@/models/AppSettings";

// Loads the singleton app-settings document, creating it with defaults on first
// access (mirrors getOrCreateSettings from the old settingsRoutes.js).
export async function getOrCreateSettings() {
  let settings = await AppSettings.findOne();
  if (!settings) {
    settings = await AppSettings.create({
      dailyWorkoutDurationHours: 24,
      dailyWorkoutStartedAt: new Date(),
    });
  }
  return settings;
}
