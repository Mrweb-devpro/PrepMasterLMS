import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { PREMIUM_PERKS } from "../constants";

export function PremiumPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Premium" subtitle="Get closer support while you learn." />
      <div className="overflow-hidden rounded-xl border border-gold/50 bg-surface shadow-md">
        <div className="bg-gold-bg px-6 py-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-gold-text">
            <Sparkles className="size-3 text-gold" /> Coming soon
          </span>
          <h2 className="mt-3 text-2xl font-semibold">SolidWorks Premium</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Pricing will be announced on the channel.
          </p>
        </div>
        <ul className="space-y-4 p-6">
          {PREMIUM_PERKS.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
                <Check className="size-3" />
              </span>
              <span>
                <span className="block text-sm font-medium">{p.title}</span>
                <span className="block text-sm text-text-muted">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border p-6">
          <Button
            className="w-full"
            variant="outline"
            onClick={() =>
              toast.success("We'll let you know", {
                description: "You'll get an email when Premium launches.",
              })
            }
          >
            Notify me when it launches
          </Button>
        </div>
      </div>
    </div>
  );
}
