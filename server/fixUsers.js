const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function fixUsers() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing in server/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log("Connected database:", mongoose.connection.name);

  const adminPassword = await bcrypt.hash("admin12345", 10);
  const clientPassword = await bcrypt.hash("client12345", 10);

  const users = [
    {
      name: "Buddy Admin",
      email: "admin@buddy.com",
      password: adminPassword,
      role: "admin",
      subscriptionStatus: "paid",
      selectedProgram: "personal-training",
    },
    {
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
    },
    {
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
    },
    {
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
    },
  ];

  for (const user of users) {
    await User.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      {
        ...user,
        email: user.email.toLowerCase(),
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );
  }

  console.log("Users fixed successfully");
  console.log("");
  console.log("Admin:");
  console.log("admin@buddy.com / admin12345");
  console.log("");
  console.log("Clients:");
  console.log("client1@buddy.com / client12345");
  console.log("client2@buddy.com / client12345");
  console.log("client3@buddy.com / client12345");

  process.exit();
}

fixUsers().catch((error) => {
  console.error(error);
  process.exit(1);
});