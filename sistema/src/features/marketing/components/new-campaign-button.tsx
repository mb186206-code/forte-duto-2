"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import type { Option } from "@/features/financeiro/types";
import { CampaignForm } from "./campaign-form";

export function NewCampaignButton({ serviceTypes, openNew }: { serviceTypes: Option[]; openNew?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(!!openNew);
  function close() {
    setOpen(false);
    if (openNew) router.replace("/marketing");
  }
  return (
    <>
      <Button size="lg" variant="highlight" className="h-12 text-base" onClick={() => setOpen(true)}>
        <Plus /> Nova campanha
      </Button>
      <BottomSheet open={open} onOpenChange={(o) => !o && close()} title="Nova campanha" description="Uma campanha é um conjunto de anúncios com o mesmo objetivo.">
        {open && <CampaignForm serviceTypes={serviceTypes} onDone={close} />}
      </BottomSheet>
    </>
  );
}
