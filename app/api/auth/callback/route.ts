import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/42api";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const tokenResponse = await getAccessToken(code);
    
    const cookieStore = await cookies();
    
    cookieStore.set("42_access_token", tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenResponse.expires_in,
      path: "/",
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(
      new URL(`/?error=token_error`, request.url)
    );
  }
}
