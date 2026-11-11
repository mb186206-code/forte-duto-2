"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RunButton } from "@/components/forms/run-button";
import { deleteAttachment, uploadServicePhoto } from "../actions";
import type { AttachmentRow } from "../types";

/** Reduz a foto no próprio celular (lado maior 1600px) para enviar rápido e gastar pouco espaço. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

function Group({ title, category, serviceId, items }: { title: string; category: "foto_antes" | "foto_depois"; serviceId: string; items: AttachmentRow[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    const small = await shrink(file);
    const fd = new FormData();
    fd.set("serviceId", serviceId);
    fd.set("category", category);
    fd.set("file", small);
    start(async () => {
      const r = await uploadServicePhoto(fd);
      setBusy(false);
      if (r.status === "success") toast.success(r.message);
      else toast.error(r.message ?? "Não foi possível enviar.");
    });
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">{title}</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => input.current?.click()} loading={busy || pending}>
          <Camera /> Adicionar foto
        </Button>
        <input ref={input} type="file" accept="image/*" className="sr-only" aria-label={`Escolher foto: ${title}`} onChange={onPick} />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma foto.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {items.map((a) => (
            <li key={a.id} className="overflow-hidden rounded-xl border bg-card">
              {a.url ? (
                <a href={a.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.url} alt={`${title} — ${a.fileName}`} className="aspect-square w-full object-cover" />
                </a>
              ) : (
                <div className="flex aspect-square items-center justify-center p-2 text-center text-xs text-muted-foreground">{a.fileName}</div>
              )}
              <div className="p-1.5">
                <RunButton size="sm" variant="ghost" className="w-full text-destructive hover:text-destructive" confirm="Apagar esta foto?" run={() => deleteAttachment(a.id, serviceId)}>
                  <Trash2 /> Apagar
                </RunButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PhotoSection({ serviceId, attachments }: { serviceId: string; attachments: AttachmentRow[] }) {
  return (
    <div className="grid gap-5">
      <Group title="Antes" category="foto_antes" serviceId={serviceId} items={attachments.filter((a) => a.category === "foto_antes")} />
      <Group title="Depois" category="foto_depois" serviceId={serviceId} items={attachments.filter((a) => a.category === "foto_depois")} />
    </div>
  );
}
