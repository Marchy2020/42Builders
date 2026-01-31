import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchEvent, getClientCredentialsToken } from "@/lib/42api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("42_access_token")?.value;

    if (!accessToken) {
      const tokenResponse = await getClientCredentialsToken();
      accessToken = tokenResponse.access_token;
    }

    const event = await fetchEvent(accessToken, parseInt(eventId));

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch event";
    
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
