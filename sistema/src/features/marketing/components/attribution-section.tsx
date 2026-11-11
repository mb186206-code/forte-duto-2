"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ActionForm } from "@/components/forms/action-form";
import { RunButton } from "@/components/forms/run-button";
import { PLATFORM_LABEL } from "@/lib/utm";
import { clearAttribution, saveAttribution } from "../actions";
import { ATTRIBUTION_LABEL, ATTRIBUTION_SHORT, type AttributionLookups, type AttributionRow, type AttributionType } from "../types";

/** "Como esse cliente chegou?" — a origem principal, com o tipo de evidência (declarada, rastreada ou desconhecida). */
export function AttributionSection({ customerId, current, lookups }: { customerId: string; current: AttributionRow | null; lookups: AttributionLookups }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AttributionType>(current?.type ?? "declarada");
  const [campaignId, setCampaignId] = useState(current?.campaignId ?? "");
  const ads = lookups.ads.filter((a) => a.campaignId === campaignId);
  const close = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Card className="grid gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Target className="size-5 text-info" aria-hidden /> Como chegou
        </h2>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Pencil /> {current ? "Trocar" : "Informar"}
        </Button>
      </div>
      {current ? (
        <div className="grid gap-1 text-sm">
          <p>
            <Badge variant={current.type === "rastreada" ? "success" : current.type === "declarada" ? "info" : "outline"}>{ATTRIBUTION_SHORT[current.type]}</Badge>{" "}
            {ATTRIBUTION_LABEL[current.type]}
          </p>
          {current.campaignName && <p>Campanha: <strong>{current.campaignName}</strong>{current.adName ? ` · anúncio ${current.adName}` : ""}</p>}
          {current.type === "rastreada" && (
            <p className="text-xs text-muted-foreground">
              {[current.utmSource && `origem ${current.utmSource}`, current.utmMedium && `meio ${current.utmMedium}`, current.utmCampaign && `campanha ${current.utmCampaign}`, current.clickId && "com código de clique"].filter(Boolean).join(" · ")}
            </p>
          )}
          {current.notes && <p className="text-muted-foreground">{current.notes}</p>}
          <RunButton size="sm" variant="ghost" className="w-fit text-muted-foreground" confirm="Remover a origem deste cliente?" run={() => clearAttribution(customerId)} onDone={() => router.refresh()}>
            Remover origem
          </RunButton>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ainda não informado. Isso ajuda a saber quais anúncios trazem clientes de verdade.</p>
      )}

      <BottomSheet open={open} onOpenChange={(o) => !o && close()} title="Como esse cliente chegou?" description="Seja sincero: se não sabe, marque “não sei”. Nada de chute.">
        {open && (
          <ActionForm action={saveAttribution} onDone={close} submitLabel="Salvar origem" submitVariant="highlight">
            {({ fe }) => (
              <>
                <input type="hidden" name="customerId" value={customerId} />
                <Field id="o-type" label="O que você sabe?" error={fe.type}>
                  <Select id="o-type" name="type" value={type} onChange={(e) => setType(e.target.value as AttributionType)}>
                    {(Object.keys(ATTRIBUTION_LABEL) as AttributionType[]).map((t) => (
                      <option key={t} value={t}>
                        {ATTRIBUTION_LABEL[t]}
                      </option>
                    ))}
                  </Select>
                </Field>
                {type !== "desconhecida" && (
                  <>
                    <Field id="o-campaign" label="Qual campanha?" optional={type === "declarada"} error={fe.campaignId}>
                      <Select id="o-campaign" name="campaignId" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                        <option value="">{type === "declarada" ? "Não sei qual" : "Escolha…"}</option>
                        {lookups.campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({PLATFORM_LABEL[c.platform]})
                          </option>
                        ))}
                      </Select>
                    </Field>
                    {ads.length > 0 && (
                      <Field id="o-ad" label="Qual anúncio?" optional error={fe.advertisementId}>
                        <Select id="o-ad" name="advertisementId" defaultValue={current?.advertisementId ?? ""}>
                          <option value="">Não sei qual</option>
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
                {type === "rastreada" && (
                  <div className="grid gap-4 rounded-xl border p-3">
                    <p className="text-sm text-muted-foreground">Dados do link (se tiver). Se escolheu a campanha acima, o código dela entra sozinho.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field id="o-src" label="Origem" optional error={fe.utmSource}>
                        <Input id="o-src" name="utmSource" defaultValue={current?.utmSource ?? ""} placeholder="instagram" />
                      </Field>
                      <Field id="o-med" label="Meio" optional error={fe.utmMedium}>
                        <Input id="o-med" name="utmMedium" defaultValue={current?.utmMedium ?? ""} placeholder="cpc" />
                      </Field>
                    </div>
                    <Field id="o-click" label="Código de clique" optional error={fe.clickId}>
                      <Input id="o-click" name="clickId" defaultValue={current?.clickId ?? ""} placeholder="gclid / fbclid" />
                    </Field>
                  </div>
                )}
                <Field id="o-notes" label="Observação" optional error={fe.notes}>
                  <Textarea id="o-notes" name="notes" rows={2} defaultValue={current?.notes ?? ""} maxLength={1000} placeholder="Ex.: Disse que viu o vídeo no Instagram" />
                </Field>
              </>
            )}
          </ActionForm>
        )}
      </BottomSheet>
    </Card>
  );
}
