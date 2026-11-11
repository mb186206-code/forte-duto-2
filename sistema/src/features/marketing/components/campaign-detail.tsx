"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ActionForm } from "@/components/forms/action-form";
import { MoneyInput } from "@/components/forms/money-input";
import { RunButton } from "@/components/forms/run-button";
import { Money } from "@/components/shared/money";
import { formatDateBR } from "@/lib/dates";
import type { Option } from "@/features/financeiro/types";
import { deleteAd, deleteCampaign, deleteMetric, saveAd, saveMetric } from "../actions";
import { CampaignForm } from "./campaign-form";
import { UtmGenerator } from "./utm-generator";
import type { AdRow, CampaignRow, MetricRow } from "../types";

const n = (v: number) => v.toLocaleString("pt-BR");

export function CampaignDetail({ campaign, ads, metrics, serviceTypes, today }: { campaign: CampaignRow; ads: AdRow[]; metrics: MetricRow[]; serviceTypes: Option[]; today: string }) {
  const router = useRouter();
  const [sheet, setSheet] = useState<"editar" | "anuncio" | "editar-anuncio" | "numeros" | null>(null);
  const [editingAd, setEditingAd] = useState<AdRow | null>(null);
  const refresh = () => router.refresh();
  const close = () => {
    setSheet(null);
    setEditingAd(null);
    router.refresh();
  };

  return (
    <div className="grid gap-4">
      <Card className="grid gap-3 p-4">
        <h2 className="font-semibold">Link da campanha</h2>
        <p className="text-sm text-muted-foreground">Use este link nos anúncios. Quem clicar e depois chamar no WhatsApp pode ser identificado como vindo desta campanha.</p>
        <UtmGenerator platform={campaign.platform} utmCampaign={campaign.utmCampaign} ads={ads} />
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Números dos anúncios</h2>
          <Button size="sm" variant="outline" onClick={() => setSheet("numeros")}>
            <Plus /> Lançar números
          </Button>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">Copie do painel do Instagram, Facebook ou Google: quanto gastou, quantas pessoas viram e clicaram.</p>
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento ainda.</p>
        ) : (
          <ul className="divide-y">
            {metrics.map((m) => (
              <li key={m.id} className="flex items-start gap-2 py-3">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">
                    {formatDateBR(m.periodStart)} a {formatDateBR(m.periodEnd)}
                    {m.adName ? ` · ${m.adName}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {n(m.reach)} alcançadas · {n(m.impressions)} vistas · {n(m.clicks)} cliques · {n(m.conversations)} conversas
                  </p>
                </div>
                <Money cents={m.spend} tone="out" className="text-sm font-semibold whitespace-nowrap" />
                <RunButton size="icon-sm" variant="ghost" confirm={undefined} run={() => deleteMetric(m.id, campaign.id)} onDone={refresh}>
                  <X />
                  <span className="sr-only">Apagar lançamento</span>
                </RunButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Anúncios</h2>
          <Button size="sm" variant="outline" onClick={() => setSheet("anuncio")}>
            <Plus /> Novo anúncio
          </Button>
        </div>
        {ads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Opcional. Cadastre cada anúncio se quiser saber qual deles traz mais clientes.</p>
        ) : (
          <ul className="divide-y">
            {ads.map((a) => (
              <li key={a.id} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{[a.format, a.utmContent && `código ${a.utmContent}`].filter(Boolean).join(" · ") || "Sem detalhes"}</p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingAd(a);
                    setSheet("editar-anuncio");
                  }}
                >
                  <Pencil />
                  <span className="sr-only">Editar anúncio</span>
                </Button>
                <RunButton size="icon-sm" variant="ghost" run={() => deleteAd(a.id, campaign.id)} onDone={refresh}>
                  <Trash2 />
                  <span className="sr-only">Apagar anúncio</span>
                </RunButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-2">
        <Button variant="outline" size="lg" onClick={() => setSheet("editar")}>
          <Pencil /> Editar campanha
        </Button>
        <RunButton variant="ghost" className="text-destructive hover:text-destructive" confirm="Apagar esta campanha, os anúncios e os números lançados? Isso não pode ser desfeito." run={() => deleteCampaign(campaign.id)}>
          <Trash2 /> Apagar campanha
        </RunButton>
      </div>

      <BottomSheet open={sheet === "editar"} onOpenChange={(o) => !o && close()} title="Editar campanha">
        {sheet === "editar" && <CampaignForm campaign={campaign} serviceTypes={serviceTypes} onDone={close} />}
      </BottomSheet>

      <BottomSheet open={sheet === "anuncio" || sheet === "editar-anuncio"} onOpenChange={(o) => !o && close()} title={editingAd ? "Editar anúncio" : "Novo anúncio"}>
        {(sheet === "anuncio" || sheet === "editar-anuncio") && (
          <ActionForm action={saveAd} onDone={close} submitLabel={editingAd ? "Salvar" : "Criar anúncio"} submitVariant="highlight">
            {({ fe }) => (
              <>
                <input type="hidden" name="campaignId" value={campaign.id} />
                {editingAd && <input type="hidden" name="id" value={editingAd.id} />}
                <Field id="a-name" label="Nome do anúncio" error={fe.name}>
                  <Input id="a-name" name="name" autoFocus defaultValue={editingAd?.name} maxLength={120} placeholder="Ex.: Vídeo da pia entupida" aria-invalid={!!fe.name || undefined} />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field id="a-format" label="Formato" optional error={fe.format}>
                    <Input id="a-format" name="format" defaultValue={editingAd?.format ?? ""} maxLength={40} placeholder="Imagem, vídeo, carrossel…" />
                  </Field>
                  <Field id="a-utm" label="Código do anúncio" optional hint="Se deixar em branco, usamos o nome." error={fe.utmContent}>
                    <Input id="a-utm" name="utmContent" defaultValue={editingAd?.utmContent ?? ""} maxLength={80} />
                  </Field>
                </div>
                <Field id="a-url" label="Página de destino" optional error={fe.destinationUrl}>
                  <Input id="a-url" name="destinationUrl" inputMode="url" defaultValue={editingAd?.destinationUrl ?? ""} maxLength={1000} placeholder="seusite.com.br" />
                </Field>
                <Field id="a-notes" label="Observação" optional error={fe.notes}>
                  <Textarea id="a-notes" name="notes" rows={2} defaultValue={editingAd?.notes ?? ""} maxLength={1000} />
                </Field>
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>

      <BottomSheet open={sheet === "numeros"} onOpenChange={(o) => !o && close()} title="Lançar números" description="Do painel da plataforma, para um período.">
        {sheet === "numeros" && (
          <ActionForm action={saveMetric} onDone={close} submitLabel="Lançar" submitVariant="highlight">
            {({ fe, pending }) => (
              <>
                <input type="hidden" name="campaignId" value={campaign.id} />
                <div className="grid grid-cols-2 gap-4">
                  <Field id="n-start" label="Primeiro dia" error={fe.periodStart}>
                    <Input id="n-start" name="periodStart" type="date" defaultValue={campaign.startDate ?? today} />
                  </Field>
                  <Field id="n-end" label="Último dia" error={fe.periodEnd}>
                    <Input id="n-end" name="periodEnd" type="date" defaultValue={today} />
                  </Field>
                </div>
                <Field id="n-spend" label="Quanto gastou" error={fe.spend}>
                  <MoneyInput id="n-spend" name="spend" autoFocus aria-invalid={!!fe.spend || undefined} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field id="n-reach" label="Pessoas alcançadas" optional error={fe.reach}>
                    <Input id="n-reach" name="reach" inputMode="numeric" placeholder="0" />
                  </Field>
                  <Field id="n-imp" label="Vezes que apareceu" optional error={fe.impressions}>
                    <Input id="n-imp" name="impressions" inputMode="numeric" placeholder="0" />
                  </Field>
                  <Field id="n-clicks" label="Cliques" optional error={fe.clicks}>
                    <Input id="n-clicks" name="clicks" inputMode="numeric" placeholder="0" />
                  </Field>
                  <Field id="n-conv" label="Conversas iniciadas" optional error={fe.conversations}>
                    <Input id="n-conv" name="conversations" inputMode="numeric" placeholder="0" />
                  </Field>
                </div>
                {ads.length > 0 && (
                  <Field id="n-ad" label="De qual anúncio?" optional hint="Em branco = campanha toda." error={fe.advertisementId}>
                    <Select id="n-ad" name="advertisementId" defaultValue="" disabled={pending}>
                      <option value="">Campanha toda</option>
                      {ads.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>
    </div>
  );
}
