"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";
import { TASKS_PAGE_SIZE } from "@/lib/constants";
import { formatDate } from "@/lib/format-date";
import { trpc } from "@/components/trpc-provider";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TaskPage = RouterOutputs["task"]["list"];

type TaskListProps = {
  initialPage: TaskPage;
};

export function TaskList({ initialPage }: TaskListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const utils = trpc.useUtils();

  const tasksQuery = trpc.task.list.useInfiniteQuery(
    { limit: TASKS_PAGE_SIZE },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: {
        pages: [initialPage],
        pageParams: [undefined]
      },
      staleTime: 30_000
    }
  );

  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: async () => {
      setFeedback({ type: "success", message: "Task deleted successfully." });
      await utils.task.list.invalidate({ limit: TASKS_PAGE_SIZE });
    },
    onError: (error) => {
      setFeedback({ type: "error", message: error.message });
    }
  });

  const tasks = useMemo(
    () => tasksQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [tasksQuery.data]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !tasksQuery.hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !tasksQuery.isFetchingNextPage) {
          void tasksQuery.fetchNextPage();
        }
      },
      { rootMargin: "180px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tasksQuery.hasNextPage, tasksQuery.isFetchingNextPage, tasksQuery.fetchNextPage]);

  function handleDelete(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this task?");

    if (confirmed) {
      setFeedback(null);
      deleteTask.mutate({ id });
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Task Manager home">
          <span className="brand-mark">✓</span>
          <span>Task Manager</span>
        </Link>
        <Link className="button button-primary" href="/tasks/new">+ New task</Link>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Keep your tasks moving.</h1>
          <p className="hero-copy">A lightweight space to capture what needs to get done.</p>
        </div>
        <div className="task-count" aria-live="polite">
          <strong>{tasks.length}</strong>
          <span>loaded tasks</span>
        </div>
      </section>

      {feedback ? (
        <p className={`notice ${feedback.type === "success" ? "notice-success" : "notice-error"}`} role="status">
          {feedback.message}
        </p>
      ) : null}

      {tasksQuery.isError && tasks.length === 0 ? (
        <p className="notice notice-error" role="alert">Could not load tasks: {tasksQuery.error.message}</p>
      ) : null}

      <section className="task-section" aria-labelledby="task-list-heading">
        <div className="list-heading">
          <div>
            <h2 id="task-list-heading">All tasks</h2>
            <p className="muted">Your newest tasks appear first.</p>
          </div>
          <span className="subtle-count">{tasks.length} shown</span>
        </div>

        {tasks.length === 0 && !tasksQuery.isLoading ? (
          <div className="empty-state">
            <div className="empty-icon">＋</div>
            <h3>No tasks yet</h3>
            <p>Create your first task to get started.</p>
            <Link className="button button-primary" href="/tasks/new">Create a task</Link>
          </div>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div className="task-card-content">
                  <div className="task-card-title-row">
                    <h3>{task.title}</h3>
                    <span className="task-dot" aria-hidden="true" />
                  </div>
                  {task.description ? <p className="task-description">{task.description}</p> : <p className="task-description muted">No description provided.</p>}
                  <p className="task-date">Created {formatDate(task.createdAt)}</p>
                </div>
                <div className="task-actions">
                  <Link className="text-action" href={`/tasks/${task.id}/edit`}>Edit</Link>
                  <button
                    className="text-action danger-action"
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    disabled={deleteTask.isPending}
                  >
                    {deleteTask.isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
        {tasksQuery.isFetchingNextPage ? <p className="loading-copy">Loading more tasks...</p> : null}
        {tasksQuery.hasNextPage ? (
          <button
            className="button button-secondary load-more-button"
            type="button"
            onClick={() => void tasksQuery.fetchNextPage()}
            disabled={tasksQuery.isFetchingNextPage}
          >
            Load more
          </button>
        ) : tasks.length > 0 ? <p className="end-of-list">You are all caught up.</p> : null}
      </section>
    </main>
  );
}
