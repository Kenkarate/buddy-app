import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const body = await readJson<{
      height?: number;
      weight?: number;
      bmi?: number;
      category?: string;
    }>(req);
    const { height, weight, bmi, category } = body;

    if (!height || !weight) {
      return NextResponse.json(
        { message: "Height and weight are required", receivedBody: body },
        { status: 400 }
      );
    }

    const heightNumber = Number(height);
    const weightNumber = Number(weight);

    const finalBmi =
      bmi ||
      Number(
        (weightNumber / ((heightNumber / 100) * (heightNumber / 100))).toFixed(1)
      );

    let finalCategory = category || "Normal";

    if (!category) {
      if (finalBmi < 18.5) finalCategory = "Underweight";
      else if (finalBmi < 25) finalCategory = "Normal";
      else if (finalBmi < 30) finalCategory = "Overweight";
      else finalCategory = "Obese";
    }

    await connectDB();
    const user = await User.findById(userId);

    user.bmiRecords.push({
      height: heightNumber,
      weight: weightNumber,
      bmi: finalBmi,
      category: finalCategory,
      date: new Date(),
    });

    await user.save();

    return NextResponse.json({
      bmi: finalBmi,
      category: finalCategory,
      records: user.bmiRecords,
    });
  } catch (error) {
    console.error("BMI ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to save BMI" },
      { status: 500 }
    );
  }
}
