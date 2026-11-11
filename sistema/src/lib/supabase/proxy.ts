import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import { isPublicPath, LOGIN_PATH, SETUP_PATH } from "@/lib/auth/routes";

/**
 * Executado pelo proxy.ts em toda navegação:
 *  1. renova a sessão (cookies) com o Supabase Auth;
 *  2. manda para o login quem não está autenticado;
 *  3. tira do login quem já está autenticado.
 * A checagem de PERMISSÃO por função acontece no servidor de cada página
 * (requireRole) e, por último, no próprio banco (RLS).
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const env = getSupabaseEnv();

  if (!env) {
    if (pathname === SETUP_PATH) return NextResponse.next();
    return NextResponse.redirect(new URL(SETUP_PATH, request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Não coloque código entre createServerClient e getClaims().
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname + request.nextUrl.search);
    return redirectWithCookies(url, response);
  }

  if (isAuthenticated && (pathname === LOGIN_PATH || pathname === "/recuperar-senha" || pathname === SETUP_PATH)) {
    return redirectWithCookies(new URL("/dashboard", request.url), response);
  }

  return response;
}

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}
