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
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey, Role } from "@/lib/auth/permissions";

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
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, phase: 1, description: "Resumo do negócio: saldo, faturamento, despesas e alertas.", keywords: ["inicio", "painel", "resumo"] },
  { key: "financeiro", label: "Financeiro", href: "/financeiro", icon: Banknote, phase: 2, description: "Entradas, despesas, contas e histórico de movimentações.", keywords: ["dinheiro", "entrada", "despesa", "saldo", "conta"] },
  { key: "clientes", label: "Clientes", href: "/clientes", icon: Users, phase: 3, description: "Cadastro de clientes, contatos e ficha individual.", keywords: ["contato", "telefone", "whatsapp"] },
  { key: "servicos", label: "Serviços", href: "/servicos", icon: Wrench, phase: 3, description: "Atendimentos, agenda e situação de cada serviço.", keywords: ["atendimento", "agenda", "calendario"] },
  { key: "orcamentos", label: "Orçamentos", href: "/orcamentos", icon: FileText, phase: 3, description: "Orçamentos numerados, aprovação e conversão em serviço.", keywords: ["proposta", "orcamento"] },
  { key: "marketing", label: "Marketing e anúncios", href: "/marketing", icon: Megaphone, phase: 4, description: "Campanhas, investimento, origem dos clientes e retorno.", keywords: ["campanha", "anuncio", "instagram", "facebook", "google", "utm", "roi"] },
  { key: "fundos", label: "Fundos da empresa", href: "/fundos", icon: PiggyBank, phase: 2, description: "Reservas para objetivos: emergência, equipamentos, expansão.", keywords: ["reserva", "meta", "poupanca"] },
  { key: "relatorios", label: "Relatórios", href: "/relatorios", icon: BarChart3, phase: 5, description: "Faturamento, despesas, fluxo de caixa, exportação PDF e Excel.", keywords: ["pdf", "excel", "exportar", "imprimir"] },
  { key: "configuracoes", label: "Configurações", href: "/configuracoes", icon: Settings, phase: 1, description: "Seu perfil, senha, tema e dados da empresa.", keywords: ["perfil", "senha", "usuario", "tema"] },
];

export type QuickAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  phase: number;
  href: string;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { key: "nova-entrada", label: "Nova entrada", icon: ArrowDownCircle, roles: ["admin", "financeiro"], phase: 2, href: "/financeiro?novo=entrada" },
  { key: "nova-despesa", label: "Nova despesa", icon: ArrowUpCircle, roles: ["admin", "financeiro"], phase: 2, href: "/financeiro?novo=despesa" },
  { key: "novo-cliente", label: "Novo cliente", icon: UserPlus, roles: ["admin", "financeiro", "operacional"], phase: 3, href: "/clientes?novo=1" },
  { key: "novo-servico", label: "Novo serviço", icon: ClipboardList, roles: ["admin", "operacional"], phase: 3, href: "/servicos?novo=1" },
  { key: "novo-orcamento", label: "Novo orçamento", icon: FilePlus2, roles: ["admin", "operacional"], phase: 3, href: "/orcamentos?novo=1" },
];

/** Fase atual de entrega do sistema (ver IMPLEMENTATION_PLAN.md). */
export const CURRENT_PHASE = 1;

export function isAvailable(phase: number): boolean {
  return phase <= CURRENT_PHASE;
}
