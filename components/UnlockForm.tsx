"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UnlockForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const claim = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setStatus("error");
        setMessage(payload.error ?? "Could not verify payment yet.");
        return;
      }

      setStatus("success");
      setMessage(payload.message ?? "Access enabled.");
      window.location.assign("/dashboard");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="claim-email" className="text-sm font-medium text-slate-200">
          Purchase email
        </label>
        <Input
          id="claim-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
        />
      </div>

      {status === "error" ? (
        <p className="rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {message}
        </p>
      ) : null}

      {status === "success" ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      <Button type="button" onClick={claim} disabled={status === "loading" || !email}>
        {status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying
          </span>
        ) : (
          "Unlock my access"
        )}
      </Button>
    </div>
  );
}
