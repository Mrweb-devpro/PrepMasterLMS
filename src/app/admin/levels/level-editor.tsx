"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { updateLevel } from "../actions";

type Level = {
  id: string;
  name: string;
  is_active: boolean;
  registration_type: "free" | "paid";
  registration_price: number | null;
  telegram_invite_link: string | null;
};

export function LevelEditor({ level }: { level: Level }) {
  const [isActive, setIsActive] = useState(level.is_active);
  const [regType, setRegType] = useState<"free" | "paid">(level.registration_type);
  const [price, setPrice] = useState<string>(
    level.registration_price != null ? String(level.registration_price) : ""
  );
  const [telegram, setTelegram] = useState(level.telegram_invite_link ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await updateLevel({
      id: level.id,
      is_active: isActive,
      registration_type: regType,
      registration_price:
        regType === "paid" && price !== "" ? Number(price) : null,
      telegram_invite_link: telegram || null,
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold">{level.name}</span>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Open" : "Closed"}
            </Badge>
            <Badge variant={regType === "paid" ? "outline" : "secondary"}>
              {regType === "paid" ? `Paid · ₦${price || "—"}` : "Free"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`active-${level.id}`} className="text-sm">
              Accept registrations
            </Label>
            <Switch
              id={`active-${level.id}`}
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Registration</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={regType === "free" ? "default" : "outline"}
                onClick={() => setRegType("free")}
              >
                Free
              </Button>
              <Button
                type="button"
                size="sm"
                variant={regType === "paid" ? "default" : "outline"}
                onClick={() => setRegType("paid")}
              >
                Paid
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`price-${level.id}`}>Price (₦)</Label>
            <Input
              id={`price-${level.id}`}
              type="number"
              placeholder="e.g. 2000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={regType !== "paid"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`telegram-${level.id}`}>Telegram invite link</Label>
            <Input
              id={`telegram-${level.id}`}
              placeholder="https://t.me/..."
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </CardContent>
    </Card>
  );
}
