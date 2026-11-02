import { TaskList } from "@/components/task-list";
import { TASKS_PAGE_SIZE } from "@/lib/constants";
import { appRouter } from "@/server/routers/_app";
import { createTRPCContext } from "@/server/trpc";

// The task list must be generated for each request so its HTML reflects current in-memory data.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Server Components can call the router directly without making an HTTP round trip.
  const caller = appRouter.createCaller(await createTRPCContext());
  const initialPage = await caller.task.list({ limit: TASKS_PAGE_SIZE, cursor: null });

  return <TaskList initialPage={initialPage} />;
}
