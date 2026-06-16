import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { normalizeFoodProduct } from "@/lib/diet";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const query = String(req.nextUrl.searchParams.get("q") || "").trim();

    if (query.length < 2) {
      return NextResponse.json({ foods: [] });
    }

    const response = await axios.get(
      "https://world.openfoodfacts.org/cgi/search.pl",
      {
        params: {
          search_terms: query,
          search_simple: 1,
          action: "process",
          json: 1,
          page_size: 8,
          fields:
            "code,product_name,generic_name,brands,nutriments,image_front_url,image_url,serving_size,quantity",
        },
        timeout: 9000,
        headers: {
          "User-Agent": "BuddyFitnessApp/1.0 (admin nutrition lookup)",
        },
      }
    );

    const foods = (response.data.products || [])
      .map(normalizeFoodProduct)
      .filter(
        (food: any) =>
          food.name && (food.calories || food.protein || food.carbs || food.fats)
      );

    return NextResponse.json({ foods });
  } catch (error) {
    console.error("FOOD NUTRITION SEARCH ERROR:", (error as Error).message);
    return NextResponse.json(
      {
        message:
          "Could not fetch nutrition data right now. Please enter the food manually.",
      },
      { status: 502 }
    );
  }
}
