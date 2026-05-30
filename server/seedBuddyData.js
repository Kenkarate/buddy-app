const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const WorkoutCategory = require("./models/WorkoutCategory");
const Exercise = require("./models/Exercise");
const WorkoutPlan = require("./models/WorkoutPlan");
const DietPlan = require("./models/DietPlan");
const FoodItem = require("./models/FoodItem");
const PricingPlan = require("./models/PricingPlan");
const DailyWorkoutSchedule = require("./models/DailyWorkoutSchedule");
const UserWorkoutAssignment = require("./models/UserWorkoutAssignment");
const UserDietAssignment = require("./models/UserDietAssignment");
const ContactIssue = require("./models/ContactIssue");

async function seedDummyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    console.log("Clearing old dummy data...");

    await WorkoutCategory.deleteMany({});
    await Exercise.deleteMany({});
    await WorkoutPlan.deleteMany({});
    await DietPlan.deleteMany({});
    await FoodItem.deleteMany({});
    await PricingPlan.deleteMany({});
    await DailyWorkoutSchedule.deleteMany({});
    await UserWorkoutAssignment.deleteMany({});
    await UserDietAssignment.deleteMany({});
    await ContactIssue.deleteMany({});

    await User.deleteMany({
      email: {
        $in: [
          "admin@buddy.com",
          "client1@buddy.com",
          "client2@buddy.com",
          "client3@buddy.com",
        ],
      },
    });

    console.log("Creating users...");

    const adminPassword = await bcrypt.hash("admin12345", 10);
    const clientPassword = await bcrypt.hash("client12345", 10);

    const admin = await User.create({
      name: "Buddy Admin",
      email: "admin@buddy.com",
      password: adminPassword,
      role: "admin",
      subscriptionStatus: "paid",
      selectedProgram: "personal-training",
      age: 30,
      height: 178,
      weight: 78,
      goal: "Manage clients",
    });

    const client1 = await User.create({
      name: "Ajesh Client",
      email: "client1@buddy.com",
      password: clientPassword,
      role: "user",
      subscriptionStatus: "trial",
      selectedProgram: "personal-training",
      age: 28,
      height: 177,
      weight: 96,
      goal: "Cutting",
      dietWarningAccepted: false,
    });

    const client2 = await User.create({
      name: "Rahul Fitness",
      email: "client2@buddy.com",
      password: clientPassword,
      role: "user",
      subscriptionStatus: "paid",
      selectedProgram: "normal-workouts",
      age: 25,
      height: 172,
      weight: 74,
      goal: "Muscle gain",
      dietWarningAccepted: false,
    });

    const client3 = await User.create({
      name: "Sara Athlete",
      email: "client3@buddy.com",
      password: clientPassword,
      role: "user",
      subscriptionStatus: "paid",
      selectedProgram: "home-workout",
      age: 26,
      height: 165,
      weight: 62,
      goal: "Maintenance",
      dietWarningAccepted: false,
    });

    console.log("Creating workout categories...");

    await WorkoutCategory.insertMany([
      {
        title: "Mixed Workout",
        slug: "mixed-workout",
        type: "normal",
        imageUrl:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
        musclesTrained: ["Chest", "Back", "Legs", "Abs"],
        isFirstFreeWorkout: true,
        order: 1,
        isActive: true,
      },
      {
        title: "Chest Workout",
        slug: "chest",
        type: "normal",
        imageUrl:
          "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80",
        musclesTrained: ["Chest", "Triceps"],
        order: 2,
        isActive: true,
      },
      {
        title: "Back Workout",
        slug: "back",
        type: "normal",
        imageUrl:
          "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=900&q=80",
        musclesTrained: ["Back", "Biceps"],
        order: 3,
        isActive: true,
      },
      {
        title: "Leg Workout",
        slug: "legs",
        type: "normal",
        imageUrl:
          "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&w=900&q=80",
        musclesTrained: ["Legs", "Glutes"],
        order: 4,
        isActive: true,
      },
      {
        title: "Abs Workout",
        slug: "abs",
        type: "normal",
        imageUrl:
          "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
        musclesTrained: ["Abs", "Core"],
        order: 5,
        isActive: true,
      },
      {
        title: "Shoulders Workout",
        slug: "shoulders",
        type: "normal",
        imageUrl:
          "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?auto=format&fit=crop&w=900&q=80",
        musclesTrained: ["Shoulders"],
        order: 6,
        isActive: true,
      },
      {
        title: "Biceps Workout",
        slug: "biceps",
        type: "normal",
        imageUrl:
          "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=80",
        musclesTrained: ["Biceps"],
        order: 7,
        isActive: true,
      },
      {
        title: "Triceps Workout",
        slug: "triceps",
        type: "normal",
        imageUrl:
          "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=900&q=80",
        musclesTrained: ["Triceps"],
        order: 8,
        isActive: true,
      },
    ]);

    console.log("Creating exercises...");

    const pushUps = await Exercise.create({
      name: "Push Ups",
      targetMuscle: "Chest",
      musclesTrained: ["Chest", "Triceps", "Shoulders"],
      gifUrl: "/gifs/push-ups.gif",
      imageUrl:
        "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=600&q=80",
      beginnerCaption:
        "Keep your body straight, lower your chest towards the floor, then push back up.",
      defaultSets: 4,
      defaultReps: 12,
      restSeconds: 60,
      difficulty: "beginner",
      isActive: true,
    });

    const squats = await Exercise.create({
      name: "Squats",
      targetMuscle: "Legs",
      musclesTrained: ["Legs", "Glutes", "Core"],
      gifUrl: "/gifs/squats.gif",
      imageUrl:
        "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&w=600&q=80",
      beginnerCaption:
        "Keep your chest up, push your hips back and squat down under control.",
      defaultSets: 4,
      defaultReps: 15,
      restSeconds: 60,
      difficulty: "beginner",
      isActive: true,
    });

    const plank = await Exercise.create({
      name: "Plank",
      targetMuscle: "Abs",
      musclesTrained: ["Abs", "Core", "Shoulders"],
      gifUrl: "/gifs/plank.gif",
      imageUrl:
        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
      beginnerCaption:
        "Keep your body straight and hold the position without dropping your hips.",
      defaultSets: 3,
      defaultReps: 0,
      defaultCount: 60,
      restSeconds: 45,
      difficulty: "beginner",
      isActive: true,
    });

    const rows = await Exercise.create({
      name: "Bent Over Rows",
      targetMuscle: "Back",
      musclesTrained: ["Back", "Biceps"],
      gifUrl: "/gifs/rows.gif",
      imageUrl:
        "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=600&q=80",
      beginnerCaption:
        "Keep your back straight and pull the weight towards your lower ribs.",
      defaultSets: 4,
      defaultReps: 10,
      restSeconds: 75,
      difficulty: "intermediate",
      isActive: true,
    });

    const shoulderPress = await Exercise.create({
      name: "Shoulder Press",
      targetMuscle: "Shoulders",
      musclesTrained: ["Shoulders", "Triceps"],
      gifUrl: "/gifs/shoulder-press.gif",
      imageUrl:
        "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?auto=format&fit=crop&w=600&q=80",
      beginnerCaption:
        "Press the dumbbells overhead without arching your lower back.",
      defaultSets: 4,
      defaultReps: 10,
      restSeconds: 75,
      difficulty: "intermediate",
      isActive: true,
    });

    console.log("Creating workout plans...");

    const mixedPlan = await WorkoutPlan.create({
      slug: "mixed-workout",
      title: "Mixed Workout",
      category: "Full Body",
      image:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
      description: "A full body workout for all major muscle groups.",
      muscles: ["Chest", "Back", "Legs", "Abs"],
      locked: false,
      isActive: true,
      exercises: [
        {
          exerciseId: pushUps._id,
          sets: 4,
          reps: 12,
          restSeconds: 60,
        },
        {
          exerciseId: squats._id,
          sets: 4,
          reps: 15,
          restSeconds: 60,
        },
        {
          exerciseId: plank._id,
          sets: 3,
          count: 60,
          restSeconds: 45,
        },
      ],
    });

    const chestPlan = await WorkoutPlan.create({
      slug: "chest",
      title: "Chest Workout",
      category: "Chest",
      image:
        "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80",
      description: "Press, push and fly motions for a strong chest.",
      muscles: ["Chest", "Triceps"],
      locked: false,
      isActive: true,
      exercises: [
        {
          exerciseId: pushUps._id,
          sets: 4,
          reps: 12,
          restSeconds: 60,
        },
      ],
    });

    const backPlan = await WorkoutPlan.create({
      slug: "back",
      title: "Back Workout",
      category: "Back",
      image:
        "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=900&q=80",
      description: "Pull movements for a stronger back.",
      muscles: ["Back", "Biceps"],
      locked: false,
      isActive: true,
      exercises: [
        {
          exerciseId: rows._id,
          sets: 4,
          reps: 10,
          restSeconds: 75,
        },
      ],
    });

    const legsPlan = await WorkoutPlan.create({
      slug: "legs",
      title: "Leg Workout",
      category: "Legs",
      image:
        "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?auto=format&fit=crop&w=900&q=80",
      description: "Lower body strength and endurance session.",
      muscles: ["Legs", "Glutes"],
      locked: true,
      isActive: true,
      exercises: [
        {
          exerciseId: squats._id,
          sets: 4,
          reps: 15,
          restSeconds: 60,
        },
      ],
    });

    const shoulderPlan = await WorkoutPlan.create({
      slug: "shoulders",
      title: "Shoulders Workout",
      category: "Shoulders",
      image:
        "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?auto=format&fit=crop&w=900&q=80",
      description: "Shoulder strength and shape workout.",
      muscles: ["Shoulders", "Triceps"],
      locked: false,
      isActive: true,
      exercises: [
        {
          exerciseId: shoulderPress._id,
          sets: 4,
          reps: 10,
          restSeconds: 75,
        },
      ],
    });

    console.log("Creating food items...");

    await FoodItem.insertMany([
      {
        name: "Rice",
        category: "carbs",
        baseQuantity: 100,
        unit: "g",
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        mealTiming: "lunch",
        tags: ["carbs", "lunch"],
        isActive: true,
      },
      {
        name: "Chicken Breast",
        category: "protein",
        baseQuantity: 100,
        unit: "g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        mealTiming: "lunch",
        tags: ["protein", "non-veg"],
        isActive: true,
      },
      {
        name: "Egg",
        category: "protein",
        baseQuantity: 1,
        unit: "piece",
        calories: 78,
        protein: 6,
        carbs: 0.6,
        fat: 5,
        mealTiming: "breakfast",
        tags: ["protein", "breakfast"],
        isActive: true,
      },
      {
        name: "Banana",
        category: "fruit",
        baseQuantity: 1,
        unit: "piece",
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        mealTiming: "pre-workout",
        tags: ["fruit", "energy"],
        isActive: true,
      },
    ]);

    console.log("Creating diet plans...");

    const cuttingDiet = await DietPlan.create({
      title: "Basic Cutting Diet",
      goal: "cutting",
      minCalories: 1400,
      maxCalories: 2200,
      isActive: true,
      meals: [
        {
          mealName: "Breakfast",
          time: "8:00 AM",
          foods: [
            {
              name: "Egg",
              quantity: "2 pieces",
              calories: 156,
              protein: 12,
              carbs: 1.2,
              fat: 10,
            },
            {
              name: "Banana",
              quantity: "1 piece",
              calories: 105,
              protein: 1.3,
              carbs: 27,
              fat: 0.4,
            },
          ],
        },
        {
          mealName: "Lunch",
          time: "1:00 PM",
          foods: [
            {
              name: "Rice",
              quantity: "150g",
              calories: 195,
              protein: 4,
              carbs: 42,
              fat: 0.5,
            },
            {
              name: "Chicken Breast",
              quantity: "150g",
              calories: 248,
              protein: 46,
              carbs: 0,
              fat: 5.4,
            },
          ],
        },
      ],
    });

    const bulkingDiet = await DietPlan.create({
      title: "Basic Bulking Diet",
      goal: "bulking",
      minCalories: 2200,
      maxCalories: 3500,
      isActive: true,
      meals: [
        {
          mealName: "Breakfast",
          time: "8:00 AM",
          foods: [
            {
              name: "Egg",
              quantity: "4 pieces",
              calories: 312,
              protein: 24,
              carbs: 2.4,
              fat: 20,
            },
            {
              name: "Banana",
              quantity: "2 pieces",
              calories: 210,
              protein: 2.6,
              carbs: 54,
              fat: 0.8,
            },
          ],
        },
        {
          mealName: "Lunch",
          time: "1:00 PM",
          foods: [
            {
              name: "Rice",
              quantity: "250g",
              calories: 325,
              protein: 6.7,
              carbs: 70,
              fat: 0.8,
            },
            {
              name: "Chicken Breast",
              quantity: "200g",
              calories: 330,
              protein: 62,
              carbs: 0,
              fat: 7.2,
            },
          ],
        },
      ],
    });

    console.log("Creating pricing plans...");

    await PricingPlan.insertMany([
      {
        planKey: "trial",
        title: "3 Day Free Trial",
        baseCurrency: "SAR",
        baseAmount: 0,
        monthly: false,
        isActive: true,
      },
      {
        planKey: "normal",
        title: "Normal Workout",
        baseCurrency: "SAR",
        baseAmount: 80,
        monthly: true,
        isActive: true,
      },
      {
        planKey: "pt",
        title: "Personal Training",
        baseCurrency: "SAR",
        baseAmount: 200,
        monthly: true,
        isActive: true,
      },
    ]);

    console.log("Creating fixed daily workout schedule...");

    await DailyWorkoutSchedule.create({
      currentWorkoutSlug: "mixed-workout",
      nextWorkoutSlug: "chest",
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      warningAt: new Date(Date.now() + 18 * 60 * 60 * 1000),
      isActive: true,
    });

    console.log("Assigning workout plans to clients...");

    await UserWorkoutAssignment.insertMany([
      {
        userId: client1._id,
        workoutPlanId: mixedPlan._id,
        assignedBy: admin._id,
        isActive: true,
      },
      {
        userId: client2._id,
        workoutPlanId: chestPlan._id,
        assignedBy: admin._id,
        isActive: true,
      },
      {
        userId: client3._id,
        workoutPlanId: shoulderPlan._id,
        assignedBy: admin._id,
        isActive: true,
      },
    ]);

    console.log("Assigning diet plans to clients...");

    await UserDietAssignment.insertMany([
      {
        userId: client1._id,
        dietPlanId: cuttingDiet._id,
        assignedBy: admin._id,
        warningAccepted: false,
        isActive: true,
      },
      {
        userId: client2._id,
        dietPlanId: bulkingDiet._id,
        assignedBy: admin._id,
        warningAccepted: false,
        isActive: true,
      },
      {
        userId: client3._id,
        dietPlanId: cuttingDiet._id,
        assignedBy: admin._id,
        warningAccepted: false,
        isActive: true,
      },
    ]);

    console.log("Adding BMI and weight records...");

    client1.weightRecords = [
      {
        weight: 98,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        weight: 97,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        weight: 96,
        date: new Date(),
      },
    ];

    client1.bmiRecords = [
      {
        height: 177,
        weight: 96,
        bmi: 30.6,
        category: "Obese",
        date: new Date(),
      },
    ];

    await client1.save();

    client2.weightRecords = [
      {
        weight: 76,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        weight: 75,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        weight: 74,
        date: new Date(),
      },
    ];

    client2.bmiRecords = [
      {
        height: 172,
        weight: 74,
        bmi: 25.0,
        category: "Overweight",
        date: new Date(),
      },
    ];

    await client2.save();

    console.log("Creating contact issues...");

    await ContactIssue.insertMany([
      {
        userId: client1._id,
        email: client1.email,
        type: "Query",
        subject: "Need help with diet",
        message: "Can I replace rice with chapati in my lunch?",
        status: "open",
      },
      {
        userId: client2._id,
        email: client2.email,
        type: "Complaint",
        subject: "Workout video not loading",
        message: "The push-up video is not opening on my phone.",
        status: "open",
      },
      {
        userId: client3._id,
        email: client3.email,
        type: "Trainer Partnership",
        subject: "Trainer partnership request",
        message: "I am a trainer and want to use Buddy for my clients.",
        trainerBusinessName: "Sara Fitness Studio",
        experience: "5 years certified personal trainer",
        phone: "+91 9876543210",
        status: "open",
      },
    ]);

    console.log("");
    console.log("Dummy data added successfully");
    console.log("");
    console.log("Admin login:");
    console.log("Email: admin@buddy.com");
    console.log("Password: admin12345");
    console.log("");
    console.log("Client login:");
    console.log("Email: client1@buddy.com");
    console.log("Password: client12345");
    console.log("");
    console.log("Other clients:");
    console.log("client2@buddy.com / client12345");
    console.log("client3@buddy.com / client12345");
    console.log("");

    process.exit();
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seedDummyData();