import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchEventUsers, getClientCredentialsToken } from "@/lib/42api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "100");

  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("42_access_token")?.value;

    if (!accessToken) {
      const tokenResponse = await getClientCredentialsToken();
      accessToken = tokenResponse.access_token;
    }

    const eventUsers = await fetchEventUsers(
      accessToken,
      parseInt(eventId),
      page,
      perPage
    );

    return NextResponse.json(eventUsers);
  } catch (error) {
    console.error("Error fetching event users:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch event users";
    
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
