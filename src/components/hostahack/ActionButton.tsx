"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Posts to a Hostahack action and refreshes the server-rendered page. */
export function ActionButton({
  hackathonId,
  action,
  body,
  label,
  pendingLabel,
  variant = "brand",
}: {
  hackathonId: string;
  action: string;
  body?: Record<string, unknown>;
  label: string;
  pendingLabel: string;
  variant?: "brand" | "outline";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        disabled={pending}
        variant={variant === "outline" ? "outline" : "default"}
        className={variant === "brand" ? "rounded-full bg-brand px-6 text-brand-foreground hover:bg-brand/90" : "rounded-full px-6"}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await fetch(`/api/hostahack/${hackathonId}/${action}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body ?? {}),
            });
            const json = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) {
              setError(json?.error ?? "Something went wrong.");
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? pendingLabel : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
