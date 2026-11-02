import { randomUUID } from "node:crypto";

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

const seedTitles = [
  "Review the project requirements",
  "Create the initial application structure",
  "Configure TypeScript and ESLint",
  "Implement the task repository",
  "Create the tRPC router",
  "Build the task list page",
  "Add the create task form",
  "Add the edit task flow",
  "Implement task deletion",
  "Add server-side rendering",
  "Configure infinite scrolling",
  "Write the project README",
  "Review accessibility and empty states",
  "Run the production build",
  "Prepare the project demonstration"
];

function createSeedTasks(): Task[] {
  const now = Date.now();

  return seedTitles.map((title, index) => {
    const createdAt = now - index * 60 * 60 * 1000;

    return {
      id: randomUUID(),
      title,
      description: `Sample task ${index + 1} for exploring the Task Manager.`,
      createdAt,
      updatedAt: createdAt
    };
  });
}

// Keep one store instance during local development hot reloads.
const globalStore = globalThis as typeof globalThis & {
  taskManagerStore?: Task[];
};

export const taskStore = globalStore.taskManagerStore ?? (globalStore.taskManagerStore = createSeedTasks());
