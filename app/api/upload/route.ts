// app/api/upload/route.ts (jika pakai App Router)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  // Kirim formData ke backend Python (http://localhost:3001/convert)
  const response = await fetch("http://localhost:8000/convert-batch", {
    method: "POST",
    body: formData,
  });

  const blob = await response.blob();

  return new NextResponse(blob, {
    headers: {
      "Content-Type": blob.type,
      "Content-Disposition": 'attachment; filename="converted.zip"',
    },
  });
}
