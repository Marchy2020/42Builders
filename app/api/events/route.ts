import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchCampusEvents, getClientCredentialsToken } from "@/lib/42api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campusId = parseInt(searchParams.get("campus_id") || "1");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "30");

  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("42_access_token")?.value;

    if (!accessToken) {
      const tokenResponse = await getClientCredentialsToken();
      accessToken = tokenResponse.access_token;
    }

    const events = await fetchCampusEvents(accessToken, campusId, page, perPage);

    // S'assurer que nous retournons toujours un tableau
    if (!Array.isArray(events)) {
      console.error("API returned non-array response:", events);
      return NextResponse.json(
        { error: "Invalid response format from 42 API" },
        { status: 500 }
      );
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch events";
    
    // Gestion spéciale pour le rate limit
    let status = 500;
    if (errorMessage.includes("429") || errorMessage.includes("Rate Limit")) {
      status = 429;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}
