"use client";

import Link from "next/link";
import { KeyRound, LogOut, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { signOut } from "@/features/auth/actions";

export function UserMenu({ name, email, role }: { name: string; email: string; role: Role }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:rounded-lg sm:pr-2"
        aria-label="Menu da conta"
      >
        <Avatar name={name} />
        <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
          <span className="max-w-36 truncate text-sm font-semibold">{name}</span>
          <span className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
          <span className="block truncate text-xs">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/configuracoes">
            <UserRound />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/configuracoes#senha">
            <KeyRound />
            Alterar senha
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()} className="text-destructive focus:text-destructive [&_svg]:text-destructive">
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
