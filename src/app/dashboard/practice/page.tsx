import { getProfile } from "@/lib/session";
import { getAllAvailableExams } from "@/lib/data";
import { ExamCard, ExamCardData } from "@/components/dashboard/exam-card";

export default async function PracticePage() {
  const profile = await getProfile();
  const exams = (await getAllAvailableExams(profile)) as ExamCardData[];

  const practice = exams.filter((e) => e.tag !== "mock_exam");
  const mocks = exams.filter((e) => e.tag === "mock_exam");

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Practice &amp; CBTs</h1>
        <p className="mt-1 text-muted-foreground">
          Attempt timed CBTs and mock exams. Your score is recorded instantly.
        </p>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-24 text-center">
          <p className="text-muted-foreground">
            No available CBTs yet — check back once an admin publishes exams.
          </p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-4 text-xl font-semibold">Mock exams</h2>
            {mocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No mock exams scheduled yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mocks.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Practice CBTs</h2>
            {practice.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No practice CBTs published yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {practice.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
