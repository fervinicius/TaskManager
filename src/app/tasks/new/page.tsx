import Link from "next/link";
import { TaskForm } from "@/components/task-form";

export default function NewTaskPage() {
  return (
    <main className="page-shell narrow-shell">
      <Link className="back-link" href="/">
        ← Back to tasks
      </Link>
      <TaskForm />
    </main>
  );
}
