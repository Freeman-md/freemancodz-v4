import * as React from "react";
import { cn } from "@/shared/utils/class-names";

const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus-visible:border-signal-300 focus-visible:ring-2 focus-visible:ring-signal-200/60",
        className,
      )}
      {...props}
    />
  ),
);

Select.displayName = "Select";
export { Select };
