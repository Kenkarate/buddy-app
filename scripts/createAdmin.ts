import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

// Run with: npm run create-admin  (loads .env.local via the script's --env-file)
async function createOrFixAdmin() {
  await connectDB();

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
    { upsert: true, returnDocument: "after" }
  );

  console.log("Admin ready");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Role:", admin.role);

  await mongoose.disconnect();
  process.exit(0);
}

createOrFixAdmin().catch((error) => {
  console.error("createAdmin failed:", error);
  process.exit(1);
});
