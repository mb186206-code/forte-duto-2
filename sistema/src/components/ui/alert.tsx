import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-0.5 rounded-lg border px-4 py-3 text-sm [&>svg]:mt-0.5 [&>svg]:size-4",
  {
    variants: {
      variant: {
        info: "border-info/20 bg-info-soft text-foreground [&>svg]:text-info",
        success: "border-success/20 bg-success-soft text-foreground [&>svg]:text-success",
        warning: "border-warning/25 bg-warning-soft text-foreground [&>svg]:text-warning",
        danger: "border-destructive/25 bg-danger-soft text-foreground [&>svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="status" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("col-start-2 font-semibold", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("col-start-2 text-muted-foreground", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
