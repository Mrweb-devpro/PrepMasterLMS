import { BookOpen, Send, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type MaterialRow = {
  id: string;
  title: string;
  file_url: string;
  is_premium: boolean;
};

export type TelegramRow = {
  id: string;
  invite_link: string;
};

export function Resources({
  materials,
  telegram,
}: {
  materials: MaterialRow[];
  telegram: { invite_link: string }[];
}) {
  const hasMaterials = materials.length > 0;
  const hasTelegram = telegram.length > 0;

  if (!hasMaterials && !hasTelegram) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Resources</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {hasMaterials && (
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Study materials</h3>
              </div>
              <div className="space-y-2">
                {materials.map((m) => (
                  <a
                    key={m.id}
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:border-primary/40 hover:bg-primary/5"
                  >
                    <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{m.title}</span>
                    {m.is_premium && (
                      <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20">
                        <Star className="h-3 w-3" /> PREMIUM
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {hasTelegram && (
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Telegram community</h3>
              </div>
              <div className="space-y-2">
                {telegram.map((t, i) => (
                  <a
                    key={i}
                    href={t.invite_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Send className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">Join class group</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
