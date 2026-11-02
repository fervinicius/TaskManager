import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const caller = appRouter.createCaller(await createTRPCContext());

  try {
    const task = await caller.task.getById({ id });

    return (
      <main className="page-shell narrow-shell">
        <Link className="back-link" href="/">
          ← Back to tasks
        </Link>
        <TaskForm task={task} />
      </main>
    );
  } catch {
    notFound();
  }
}
