// app/api/upload/route.ts (jika pakai App Router)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BE_URL}/convert-batch`,
    {
      method: "POST",
      body: formData,
    }
  );

  const blob = await response.blob();

  return new NextResponse(blob, {
    headers: {
      "Content-Type": blob.type,
      "Content-Disposition": 'attachment; filename="converted.zip"',
    },
  });
}
