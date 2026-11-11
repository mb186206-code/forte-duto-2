import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // tudo, exceto arquivos estáticos e imagens
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|forte-duto-mascote.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
