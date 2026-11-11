import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Encerra a sessão de quem foi desativado e volta para o login com o aviso. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const motivo = request.nextUrl.searchParams.get("motivo") === "inativo" ? "inativo" : "saiu";
  return NextResponse.redirect(new URL(`/login?motivo=${motivo}`, request.url));
}
