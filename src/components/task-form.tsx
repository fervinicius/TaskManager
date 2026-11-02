"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Task } from "@/server/db/in-memory-store";
import { TASKS_PAGE_SIZE } from "@/lib/constants";
import { trpc } from "@/components/trpc-provider";

type TaskFormProps = {
  task?: Task;
};

export function TaskForm({ task }: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  async function handleSuccess() {
    // Mark cached list data as stale so the newly rendered page fetches the latest tasks.
    await utils.task.list.invalidate({ limit: TASKS_PAGE_SIZE });
    router.push("/");
    router.refresh();
  }

  const createTask = trpc.task.create.useMutation({ onSuccess: handleSuccess });
  const updateTask = trpc.task.update.useMutation({ onSuccess: handleSuccess });

  const isPending = createTask.isPending || updateTask.isPending;
  const serverError = createTask.error?.message ?? updateTask.error?.message;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setFormError("Title is required.");
      return;
    }

    const normalizedDescription = description.trim() || undefined;

    if (task) {
      updateTask.mutate({
        id: task.id,
        title: normalizedTitle,
        description: normalizedDescription
      });
      return;
    }

    createTask.mutate({
      title: normalizedTitle,
      description: normalizedDescription
    });
  }

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <p className="eyebrow">TASK MANAGER</p>
        <h1>{task ? "Edit task" : "Create a task"}</h1>
        <p className="muted">Add a clear title and an optional description.</p>
      </div>

      <form className="task-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="title">Title <span aria-hidden="true">*</span></label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="e.g. Prepare the sprint review"
          required
          aria-invalid={Boolean(formError)}
          aria-describedby={formError ? "title-error" : undefined}
        />
        {formError ? <p id="title-error" className="field-error">{formError}</p> : null}

        <label htmlFor="description">Description <span className="muted">(optional)</span></label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
          rows={5}
          placeholder="Add a few details to make this task easier to understand."
        />

        {serverError ? <p className="notice notice-error" role="alert">{serverError}</p> : null}

        <div className="form-actions">
          <Link className="button button-secondary" href="/">Cancel</Link>
          <button className="button button-primary" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : task ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </section>
  );
}
