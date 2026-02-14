import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchEventUsers, getClientCredentialsToken, fetchCurrentUser } from "@/lib/42api";

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
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    try {
      const currentUser = await fetchCurrentUser(accessToken);
      if (currentUser.login !== "mcherkao") {
        return NextResponse.json(
          { error: "Access denied. Only administrators can view participants list." },
          { status: 403 }
        );
      }
    } catch (err) {
      console.error("Error checking admin access:", err);
      return NextResponse.json(
        { error: "Failed to verify permissions" },
        { status: 500 }
      );
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
