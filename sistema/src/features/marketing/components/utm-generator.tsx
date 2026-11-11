"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PLATFORM_SOURCE, buildUtmLink } from "@/lib/utm";
import type { AdRow } from "../types";

const KEY = "fd_site_url";

/** Gera o link com código de campanha. Quem entrar por ele fica "rastreado" quando o contato for cadastrado. */
export function UtmGenerator({ platform, utmCampaign, ads }: { platform: string; utmCampaign: string | null; ads: AdRow[] }) {
  const [site, setSite] = useState("");
  const [adId, setAdId] = useState("");
  const [medium, setMedium] = useState("cpc");

  useEffect(() => {
    try {
      // lê o endereço guardado neste aparelho (só existe no navegador, por isso fora da renderização)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSite(localStorage.getItem(KEY) ?? "");
    } catch {
      /* sem armazenamento: tudo bem */
    }
  }, []);

  const ad = ads.find((a) => a.id === adId);
  const link = utmCampaign ? buildUtmLink(ad?.destinationUrl || site, { source: PLATFORM_SOURCE[platform] ?? "anuncio", medium, campaign: utmCampaign, content: ad?.utmContent ?? undefined }) : null;

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não consegui copiar. Segure o link para copiar à mão.");
    }
  }

  if (!utmCampaign) return <p className="text-sm text-muted-foreground">Esta campanha ainda não tem código de link. Edite a campanha e preencha o código.</p>;

  return (
    <div className="grid gap-3">
      <Field id="u-site" label="Endereço da página de destino" hint={ad?.destinationUrl ? "Usando o endereço do anúncio escolhido." : "Para onde a pessoa vai ao clicar no anúncio."}>
        <Input
          id="u-site"
          value={ad?.destinationUrl || site}
          disabled={!!ad?.destinationUrl}
          inputMode="url"
          placeholder="seusite.com.br"
          onChange={(e) => {
            setSite(e.target.value);
            try {
              localStorage.setItem(KEY, e.target.value);
            } catch {
              /* ok */
            }
          }}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field id="u-ad" label="De qual anúncio?" optional>
          <Select id="u-ad" value={adId} onChange={(e) => setAdId(e.target.value)}>
            <option value="">Da campanha toda</option>
            {ads.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="u-medium" label="Tipo de anúncio">
          <Select id="u-medium" value={medium} onChange={(e) => setMedium(e.target.value)}>
            <option value="cpc">Anúncio pago (cpc)</option>
            <option value="social">Publicação (social)</option>
            <option value="bio">Link da bio</option>
          </Select>
        </Field>
      </div>
      {link ? (
        <div className="grid gap-2">
          <p className="rounded-lg bg-secondary/60 p-3 text-xs break-all" aria-label="Link gerado">{link}</p>
          <Button type="button" variant="highlight" size="lg" onClick={copy}>
            <Copy /> Copiar link
          </Button>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link2 className="size-4" aria-hidden /> Digite o endereço da página para gerar o link.
        </p>
      )}
    </div>
  );
}
