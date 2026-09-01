import { createClient } from "@/lib/supabase/server";
import { LevelEditor } from "./level-editor";

export default async function LevelsPage() {
  const supabase = await createClient();

  const [{ data: levels }, { data: tracks }] = await Promise.all([
    supabase.from("levels").select("*").order("order"),
    supabase.from("tracks").select("*"),
  ]);

  const secondary = (tracks ?? []).find((t) => t.type === "secondary");
  const university = (tracks ?? []).find((t) => t.type === "university");

  const groups = [
    { title: "Secondary (SS1 – SS3)", levels: levels?.filter((l) => l.track_id === secondary?.id) ?? [] },
    { title: "University (100L – 500L)", levels: levels?.filter((l) => l.track_id === university?.id) ?? [] },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Levels</h1>
        <p className="mt-1 text-muted-foreground">
          Control which levels accept registration, and set free/paid pricing and
          Telegram access for each.
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.title}>
          <h2 className="mb-3 text-lg font-semibold">{group.title}</h2>
          {group.levels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No levels in this track yet.
            </p>
          ) : (
            <div className="space-y-3">
              {group.levels.map((level) => (
                <LevelEditor key={level.id} level={level} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
