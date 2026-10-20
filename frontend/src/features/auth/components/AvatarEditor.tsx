import { useRef, useState } from "react";
import { Dices, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "../session";
import { generateAvatarUrl } from "../utils/avatar";
import { ProfileAvatar } from "./ProfileAvatar";

export function AvatarEditor() {
  const { user, update } = useSession();
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const shuffle = async () => {
    if (!user || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      await update({ avatarUrl: generateAvatarUrl(user.gender) });
      toast.success("Avatar updated!");
    } catch {
      // The session provider has already shown the save error.
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <ProfileAvatar user={user} size="lg" />
      <Button type="button" size="sm" variant="outline" disabled={!user || saving} onClick={shuffle}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Dices className="size-4" />}
        Shuffle avatar
      </Button>
    </div>
  );
}
