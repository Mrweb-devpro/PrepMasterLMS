import Link from "next/link";
import { getUser } from "@/lib/session";
import { hasPremiumSubscription } from "@/lib/access";
import { isAdmin } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Lock, Crown } from "lucide-react";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export default async function StudentMaterialsPage() {
  const user = await getUser();
  const [premium, admin] = await Promise.all([
    user ? hasPremiumSubscription(user.id) : Promise.resolve(false),
    isAdmin(),
  ]);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const service = createAdminClient(url, key);
  const [{ data: materials }, { data: subjects }, { data: courses }] = await Promise.all([
    service.from("materials").select("*").order("created_at", { ascending: false }),
    service.from("subjects").select("id, name"),
    service.from("courses").select("id, name, code"),
  ]);
  const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s.name]));
  const courseMap = new Map((courses ?? []).map((c) => [c.id, `${c.code} — ${c.name}`]));

  const canAccess = (m: { is_premium: boolean }) => !m.is_premium || premium || admin;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <BookOpen className="h-7 w-7 text-primary" />
          Materials
        </h1>
        <p className="mt-1 text-muted-foreground">Study notes, PDFs and resources you can read. Premium items require a package.</p>
        {premium && <Badge className="mt-3">Premium active</Badge>}
      </div>

      {materials && materials.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((m) => {
            const locked = !canAccess(m);
            return (
              <Card key={m.id} className={locked ? "opacity-90" : ""}>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold leading-tight">{m.title}</h3>
                    {m.is_premium && <Badge variant={locked ? "secondary" : "default"}>Premium</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {m.subject_id ? subjectMap.get(m.subject_id) ?? "Subject" : m.course_id ? courseMap.get(m.course_id) ?? "Course" : "General"}
                  </p>
                  <div className="pt-2">
                    {locked ? (
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/packages">
                          <Lock className="mr-2 h-4 w-4" /> Unlock with Premium <Crown className="ml-1 h-4 w-4 text-amber-500" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <a href={m.file_url} target="_blank" rel="noreferrer">
                          <BookOpen className="mr-2 h-4 w-4" /> Read / Download
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No materials yet. Check back soon.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
