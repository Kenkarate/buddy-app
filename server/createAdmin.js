const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

async function createOrFixAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const email = "admin@buddy.com";
  const password = "admin12345";

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await User.findOneAndUpdate(
    { email },
    {
      name: "Buddy Admin",
      email,
      password: hashedPassword,
      role: "admin",
      subscriptionStatus: "paid",
    },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  console.log("Admin ready");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Role:", admin.role);

  process.exit();
}

createOrFixAdmin();