"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateExamSettings } from "../../actions";

type Exam = {
  id: string;
  review_enabled: boolean;
  re_attempts_enabled: boolean;
  show_explanations: boolean;
  free: boolean;
  is_premium: boolean;
  price: number | null;
  duration_minutes: number;
};

export function ExamSettings({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [review, setReview] = useState(exam.review_enabled);
  const [retry, setRetry] = useState(exam.re_attempts_enabled);
  const [explain, setExplain] = useState(exam.show_explanations);
  const [free, setFree] = useState(exam.free);
  const [premium, setPremium] = useState(exam.is_premium);
  const [price, setPrice] = useState(exam.price ?? 0);
  const [duration, setDuration] = useState(exam.duration_minutes);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await updateExamSettings(exam.id, {
      review_enabled: review,
      re_attempts_enabled: retry,
      show_explanations: explain,
      free,
      is_premium: premium,
      price: free || premium ? null : price,
      duration_minutes: duration,
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Settings</h2>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label>Review answers</Label>
          <Switch checked={review} onCheckedChange={setReview} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label>Allow re-attempts</Label>
          <Switch checked={retry} onCheckedChange={setRetry} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label>Show explanations</Label>
          <Switch checked={explain} onCheckedChange={setExplain} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label>Free access</Label>
          <Switch checked={free} onCheckedChange={setFree} />
        </div>
        {!free && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Premium</Label>
            <Switch checked={premium} onCheckedChange={setPremium} />
          </div>
        )}
        {!free && !premium && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Price (NGN)</Label>
            <Input
              type="number"
              min={0}
              className="w-28"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
            />
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label>Duration (min)</Label>
          <Input
            type="number"
            min={1}
            className="w-24"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 1)}
          />
        </div>
      </div>
    </Card>
  );
}
