/**
 * Dinheiro sem ponto flutuante.
 *
 * Todo valor monetário dentro do app é representado em CENTAVOS (inteiro,
 * `bigint`-safe até R$ 90 trilhões com Number.MAX_SAFE_INTEGER). O banco guarda
 * numeric(14,2); a conversão acontece só nas bordas (leitura/escrita).
 *
 *   parseBRL("1.234,56")  → 123456
 *   formatBRL(123456)     → "R$ 1.234,56"
 *   toDbAmount(123456)    → "1234.56"   (string, para o Postgres numeric)
 *   fromDbAmount("1234.56") → 123456
 */

export type Cents = number;

const MAX_CENTS = 99_999_999_999_99; // limite de numeric(14,2)

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function assertCents(value: Cents): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Valor em centavos inválido: ${value}`);
  }
}

/** Formata centavos como moeda brasileira: 123456 → "R$ 1.234,56" */
export function formatBRL(cents: Cents): string {
  assertCents(cents);
  // divisão por 100 de um inteiro seguro é exata para exibição com 2 casas
  return brl.format(cents / 100).replace(/ /g, " ");
}

/**
 * Converte o que a pessoa digitou em centavos.
 * Aceita "1234,56", "1.234,56", "R$ 1.234,56", "1234.56", "1234", "0,5".
 * Retorna null quando não é um valor válido.
 */
export function parseBRL(input: string): Cents | null {
  if (typeof input !== "string") return null;
  let s = input.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (s === "") return null;

  let negative = false;
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let intPart: string;
  let fracPart = "";

  if (lastComma >= 0) {
    // vírgula é o separador decimal (padrão brasileiro); pontos são milhar
    intPart = s.slice(0, lastComma).replace(/\./g, "");
    fracPart = s.slice(lastComma + 1);
  } else if (lastDot >= 0) {
    const afterDot = s.slice(lastDot + 1);
    const dotCount = (s.match(/\./g) ?? []).length;
    if (dotCount === 1 && afterDot.length > 0 && afterDot.length <= 2) {
      // "1234.5" / "1234.56" → decimal
      intPart = s.slice(0, lastDot);
      fracPart = afterDot;
    } else {
      // "1.234" / "1.234.567" → milhar
      intPart = s.replace(/\./g, "");
    }
  } else {
    intPart = s;
  }

  if (intPart === "") intPart = "0";
  if (!/^\d+$/.test(intPart) || !/^\d{0,2}$/.test(fracPart)) return null;

  const cents = Number(intPart) * 100 + Number(fracPart.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_CENTS) return null;
  return negative ? -cents : cents;
}

/** Centavos → string decimal para o banco: 123456 → "1234.56" */
export function toDbAmount(cents: Cents): string {
  assertCents(cents);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const int = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${int}.${frac}`;
}

/**
 * Valor vindo do banco (numeric chega como number ou string) → centavos.
 * Faz o parse pela representação textual para não herdar erro de float.
 */
export function fromDbAmount(value: string | number | null | undefined): Cents {
  if (value === null || value === undefined || value === "") return 0;
  const s = typeof value === "number" ? value.toFixed(2) : value.trim();
  const m = /^(-)?(\d+)(?:\.(\d{1,}))?$/.exec(s);
  if (!m) throw new RangeError(`Valor do banco inválido: ${value}`);
  const [, neg, int, frac = ""] = m;
  // arredonda meio para cima na 3ª casa, se houver
  let cents = Number(int) * 100 + Number(frac.slice(0, 2).padEnd(2, "0"));
  if (frac.length > 2 && Number(frac[2]) >= 5) cents += 1;
  return neg ? -cents : cents;
}

/** Soma segura de centavos */
export function sumCents(values: Cents[]): Cents {
  let total = 0;
  for (const v of values) {
    assertCents(v);
    total += v;
  }
  assertCents(total);
  return total;
}

/**
 * Percentual com 1 casa (ex.: conversão, ROI). Retorna null se o denominador é 0
 * — "não dá para calcular" é diferente de 0%.
 */
export function percent(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return Math.round((numerator * 1000) / denominator) / 10;
}

/** Divide centavos por uma quantidade (ex.: custo por cliente), arredondando ao centavo. */
export function divideCents(cents: Cents, by: number): Cents | null {
  assertCents(cents);
  if (!Number.isFinite(by) || by <= 0) return null;
  return Math.round(cents / by);
}

/** ROI (%) = (receita atribuída − investimento) / investimento × 100 */
export function roiPercent(revenueCents: Cents, investmentCents: Cents): number | null {
  if (investmentCents <= 0) return null;
  return percent(revenueCents - investmentCents, investmentCents);
}

export function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;
}

/** Centavos → texto para preencher um campo de valor ("12345" → "123,45"). */
export function toInputValue(cents: Cents): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}
