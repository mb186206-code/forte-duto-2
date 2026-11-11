import {
  BarChart3,
  Banknote,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Megaphone,
  PiggyBank,
  Settings,
  Users,
  Wrench,
  ArrowDownCircle,
  ArrowUpCircle,
  UserPlus,
  FilePlus2,
  House,
  type LucideIcon,
} from "lucide-react";
export type ModuleKey =
  | "dashboard"
  | "financeiro"
  | "clientes"
  | "servicos"
  | "orcamentos"
  | "marketing"
  | "fundos"
  | "relatorios"
  | "configuracoes";

export type NavItem = {
  key: ModuleKey;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Fase do plano em que o módulo fica funcional (1 = já disponível). */
  phase: number;
  keywords?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, phase: 1, description: "Resumo do dia e atalhos.", keywords: ["inicio", "painel", "resumo"] },
  { key: "financeiro", label: "Financeiro", href: "/financeiro", icon: Banknote, phase: 2, description: "Anote o dinheiro que entra e o que sai, e veja quanto tem.", keywords: ["dinheiro", "entrada", "despesa", "saldo", "conta"] },
  { key: "clientes", label: "Clientes", href: "/clientes", icon: Users, phase: 3, description: "Guarde o nome, o telefone e o endereço de cada cliente.", keywords: ["contato", "telefone", "whatsapp"] },
  { key: "servicos", label: "Serviços", href: "/servicos", icon: Wrench, phase: 3, description: "Veja os serviços marcados e como está cada um.", keywords: ["atendimento", "agenda", "calendario"] },
  { key: "orcamentos", label: "Orçamentos", href: "/orcamentos", icon: FileText, phase: 3, description: "Faça orçamentos e transforme em serviço quando o cliente aprovar.", keywords: ["proposta", "orcamento"] },
  { key: "marketing", label: "Marketing e anúncios", href: "/marketing", icon: Megaphone, phase: 4, description: "Veja quanto gastou em anúncios e quantos clientes vieram deles.", keywords: ["campanha", "anuncio", "instagram", "facebook", "google", "utm", "roi"] },
  { key: "fundos", label: "Fundos da empresa", href: "/fundos", icon: PiggyBank, phase: 2, description: "Separe dinheiro para emergências, equipamentos e outros planos.", keywords: ["reserva", "meta", "poupanca"] },
  { key: "relatorios", label: "Relatórios", href: "/relatorios", icon: BarChart3, phase: 5, description: "Relatórios do mês para ver, imprimir ou baixar.", keywords: ["pdf", "excel", "exportar", "imprimir"] },
  { key: "configuracoes", label: "Configurações", href: "/configuracoes", icon: Settings, phase: 1, description: "Seu nome e a aparência do sistema.", keywords: ["nome", "tema", "escuro", "sair"] },
];

export type QuickAction = {
  key: string;
  /** Texto em linguagem do dia a dia (o que a pessoa acabou de fazer). */
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Cor do ícone: verde para dinheiro que entra, vermelho para o que sai. */
  tone: "in" | "out" | "neutral";
  phase: number;
  href: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { key: "nova-entrada", label: "Recebi dinheiro", hint: "Nova entrada", icon: ArrowDownCircle, tone: "in", phase: 2, href: "/financeiro?novo=entrada" },
  { key: "nova-despesa", label: "Paguei uma conta", hint: "Nova despesa", icon: ArrowUpCircle, tone: "out", phase: 2, href: "/financeiro?novo=despesa" },
  { key: "novo-cliente", label: "Novo cliente", hint: "Cadastrar contato", icon: UserPlus, tone: "neutral", phase: 3, href: "/clientes?novo=1" },
  { key: "novo-servico", label: "Novo serviço", hint: "Agendar atendimento", icon: ClipboardList, tone: "neutral", phase: 3, href: "/servicos?novo=1" },
  { key: "novo-orcamento", label: "Novo orçamento", hint: "Fazer orçamento", icon: FilePlus2, tone: "neutral", phase: 3, href: "/orcamentos?novo=1" },
];

/**
 * Barra inferior do celular: só o essencial, com nomes simples.
 * 3 abas, o botão "+" do meio (ações rápidas) e "Menu" (todos os módulos).
 */
export const MOBILE_TABS: { key: ModuleKey; label: string; href: string; icon: LucideIcon }[] = [
  { key: "dashboard", label: "Início", href: "/dashboard", icon: House },
  { key: "financeiro", label: "Dinheiro", href: "/financeiro", icon: Banknote },
  { key: "servicos", label: "Serviços", href: "/servicos", icon: Wrench },
];

/** Fase atual de entrega do sistema (ver IMPLEMENTATION_PLAN.md). */
export const CURRENT_PHASE = 3;

export function isAvailable(phase: number): boolean {
  return phase <= CURRENT_PHASE;
}
