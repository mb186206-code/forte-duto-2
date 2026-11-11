import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

/** Mostra quem está usando este celular; leva às configurações. */
export function UserMenu({ name }: { name: string }) {
  return (
    <Link
      href="/configuracoes"
      aria-label={`Usando como ${name}. Abrir configurações`}
      className="flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 lg:rounded-lg lg:pr-2"
    >
      <Avatar name={name} />
      <span className="hidden max-w-36 truncate text-sm font-semibold lg:block">{name}</span>
    </Link>
  );
}
