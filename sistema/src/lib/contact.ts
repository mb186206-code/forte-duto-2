/** Só os números de um telefone. */
export const phoneDigits = (s?: string | null) => (s ?? "").replace(/\D/g, "");

/** Link que abre a conversa no WhatsApp (assume Brasil se o número não tiver o 55). */
export function whatsappLink(phone?: string | null, text?: string): string | null {
  let d = phoneDigits(phone);
  if (d.length < 10) return null;
  if (d.length <= 11) d = `55${d}`;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Mostra "(11) 91234-5678" quando dá; senão devolve como foi digitado. */
export function formatPhone(s?: string | null): string {
  if (!s) return "";
  const d = phoneDigits(s);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return s;
}
