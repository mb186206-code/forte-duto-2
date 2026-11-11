import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, NAME_COOKIE, verifyAccess } from "@/lib/access/token";
import { getAccessConfig } from "@/lib/access/config";

const ENTRY_PATH = "/entrar";
const SETUP_PATH = "/configuracao-pendente";

/**
 * Sem login: o celular só precisa (1) ter digitado o código da empresa, se ele
 * existir, e (2) informar o nome de quem usa. Os dois ficam guardados no celular.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === SETUP_PATH) return NextResponse.next();

  const dbConfigured = Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
  if (!dbConfigured) return NextResponse.redirect(new URL(SETUP_PATH, request.url));

  const access = getAccessConfig();
  const hasPass = access ? await verifyAccess(request.cookies.get(ACCESS_COOKIE)?.value, access.secret, access.code) : true;
  const hasName = Boolean(request.cookies.get(NAME_COOKIE)?.value);
  const ready = hasPass && hasName;

  if (!ready && pathname !== ENTRY_PATH) {
    return NextResponse.redirect(new URL(ENTRY_PATH, request.url));
  }
  if (ready && pathname === ENTRY_PATH) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|forte-duto-mascote.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
