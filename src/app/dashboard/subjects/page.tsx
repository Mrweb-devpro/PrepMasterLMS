import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile } from "@/lib/session";
import { getSubjects } from "@/lib/data";

export default async function SubjectsPage() {
  const profile = await getProfile();
  const subjects = await getSubjects(profile);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight">Your subjects</h1>
      <p className="mt-1 text-muted-foreground">
        Practice past questions, CBTs and mock exams for each science subject.
      </p>

      {subjects.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed py-24 text-center">
          <p className="text-muted-foreground">
            No subjects available yet.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link key={subject.id} href={`/dashboard/subjects/${subject.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-lg font-semibold">{subject.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      CBTs &amp; mock exams
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
