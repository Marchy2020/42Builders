import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("42_access_token");
  
  return NextResponse.redirect(new URL("/", request.url));
}
