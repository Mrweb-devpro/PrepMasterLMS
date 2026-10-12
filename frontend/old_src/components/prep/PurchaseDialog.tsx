import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNaira } from "@/lib/mock-data";

export function PurchaseDialog({
  open,
  onOpenChange,
  itemName,
  price,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  price: number;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg border-border bg-surface shadow-lg sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-gold-bg text-gold-text">
            <Lock className="size-5" />
          </span>
          <DialogTitle className="text-lg">Unlock this item</DialogTitle>
          <DialogDescription className="text-text-secondary">
            {itemName} is a paid item. Complete the payment to add it to your library.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-surface-subtle px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Amount</span>
            <span className="text-lg font-semibold text-gold-text">{formatNaira(price)}</span>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-text-muted">
          <ShieldCheck className="size-3.5" />
          Prototype only — no real payment is processed.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-gold text-foreground hover:bg-gold/85"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Pay {formatNaira(price)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
