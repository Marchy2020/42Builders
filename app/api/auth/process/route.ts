import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/42api";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body.code;

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const tokenResponse = await getAccessToken(code);
    
    const cookieStore = await cookies();
    
    cookieStore.set("42_access_token", tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenResponse.expires_in,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Auth process error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to process authentication";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
