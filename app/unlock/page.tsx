import type { Metadata } from "next";
import { UnlockForm } from "@/components/UnlockForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Unlock Access",
  description:
    "Activate your Interview Ghosting Tracker subscription after Stripe checkout."
};

export default function UnlockPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Unlock subscriber access</h1>
        <p className="mt-2 text-slate-300">
          After checkout, Stripe sends your payment confirmation to our webhook. Use the same
          email from checkout to enable your dashboard cookie.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <UnlockForm />
        </CardContent>
      </Card>
    </div>
  );
}
