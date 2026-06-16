const mongoose = require("mongoose");
require("dotenv").config();
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const PricingPlan = require("./models/PricingPlan");

// Seeds the admin-editable PricingPlan rows from the current hardcoded prices.
// baseAmount is stored in INR major units (rupees), matching what paymentRoutes
// expects (it multiplies by 100 to get paise). Safe to re-run: it upserts and
// never overwrites a price an admin has already changed.
const SEED_PLANS = [
  { planKey: "normal-workouts", title: "Normal Workout", baseAmount: 80 },
  { planKey: "home-workout", title: "Home Workout", baseAmount: 150 },
  { planKey: "personal-training", title: "Personal Training", baseAmount: 999 },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const plan of SEED_PLANS) {
    const existing = await PricingPlan.findOne({ planKey: plan.planKey });

    if (existing) {
      console.log(`Skipping ${plan.planKey} (already exists: ${existing.baseAmount} ${existing.baseCurrency})`);
      continue;
    }

    await PricingPlan.create({
      planKey: plan.planKey,
      title: plan.title,
      baseAmount: plan.baseAmount,
      baseCurrency: "INR",
      monthly: true,
      isActive: true,
    });

    console.log(`Seeded ${plan.planKey}: ₹${plan.baseAmount}`);
  }

  console.log("Pricing seed complete.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Pricing seed failed:", error);
  process.exit(1);
});
