import { NextResponse } from "next/server";
import { getActiveMediaSlider } from "@/app/(admin-superadmin)/video-post/action";

export async function GET() {
  try {
    const data = await getActiveMediaSlider();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Gagal mengambil media slider via API:", error);
    return NextResponse.json([], { status: 500 });
  }
}
