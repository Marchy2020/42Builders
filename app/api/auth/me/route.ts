import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchCurrentUser, getClientCredentialsToken } from "@/lib/42api";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("42_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await fetchCurrentUser(accessToken);

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch current user";
    
    // Gestion spéciale pour le rate limit
    let status = 500;
    if (errorMessage.includes("429") || errorMessage.includes("Rate Limit")) {
      status = 429;
    } else if (errorMessage.includes("Not authenticated") || errorMessage.includes("401")) {
      status = 401;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}
