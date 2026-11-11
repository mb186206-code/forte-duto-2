/** Texto → valor seguro para UTM: minúsculas, sem acento, só a-z 0-9 _ - (máx. 80). */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export const UTM_VALUE = /^[a-z0-9][a-z0-9_-]{0,79}$/;

export type UtmParams = { source: string; medium: string; campaign: string; content?: string; term?: string };

/** Monta o link com os parâmetros UTM, mantendo os que já existem no endereço. Devolve null se o endereço for inválido. */
export function buildUtmLink(baseUrl: string, p: UtmParams): string | null {
  const raw = baseUrl.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!url.hostname.includes(".")) return null;
  url.searchParams.set("utm_source", p.source);
  url.searchParams.set("utm_medium", p.medium);
  url.searchParams.set("utm_campaign", p.campaign);
  if (p.content) url.searchParams.set("utm_content", p.content);
  if (p.term) url.searchParams.set("utm_term", p.term);
  return url.toString();
}

export const PLATFORM_LABEL: Record<string, string> = { instagram_ads: "Instagram", facebook_ads: "Facebook", google_ads: "Google", outras: "Outras" };
export const PLATFORM_SOURCE: Record<string, string> = { instagram_ads: "instagram", facebook_ads: "facebook", google_ads: "google", outras: "anuncio" };
