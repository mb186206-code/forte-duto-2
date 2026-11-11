import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FormState } from "@/lib/form-state";

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  const ok = state.status === "success";
  return (
    <Alert variant={ok ? "success" : "danger"} role={ok ? "status" : "alert"}>
      {ok ? <CheckCircle2 /> : <AlertCircle />}
      <AlertDescription className="text-foreground">{state.message}</AlertDescription>
    </Alert>
  );
}
