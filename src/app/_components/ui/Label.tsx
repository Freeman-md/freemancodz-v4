import * as React from "react";
import { cn } from "@/app/_utils/class-names";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-semibold text-ink", className)} {...props} />;
}

export { Label };
