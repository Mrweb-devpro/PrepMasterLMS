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
      if (await update({ avatarUrl: generateAvatarUrl(user.gender) })) toast.success("Avatar updated!");
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
      <p className="text-center text-2xs text-text-muted">
        <a href="https://www.dicebear.com/styles/adventurer/" target="_blank" rel="noreferrer" className="underline">Adventurer by Lisa Wischofsky</a>
        {" · "}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline">CC BY 4.0</a>
        {" · Customized with DiceBear"}
      </p>
    </div>
  );
}
