import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { error: "Slide image API disabled" },
    { status: 410 }
  )
}
