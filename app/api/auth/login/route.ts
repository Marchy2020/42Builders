import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/42api";

export async function GET() {
  const authUrl = getAuthorizationUrl();
  return NextResponse.redirect(authUrl);
}
