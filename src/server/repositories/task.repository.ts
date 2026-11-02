import { randomUUID } from "node:crypto";
import { taskStore, type Task } from "@/server/db/in-memory-store";

export interface CreateTaskData {
  title: string;
  description?: string;
}

export interface UpdateTaskData extends CreateTaskData {
  id: string;
}

export const taskRepository = {
  findPage(limit: number, offset: number) {
    const items = taskStore.slice(offset, offset + limit + 1);
    const hasNextPage = items.length > limit;

    if (hasNextPage) {
      items.pop();
    }

    return {
      items,
      nextCursor: hasNextPage ? offset + limit : undefined
    };
  },

  findById(id: string) {
    return taskStore.find((task) => task.id === id) ?? null;
  },

  create(data: CreateTaskData) {
    const now = Date.now();
    const task: Task = {
      id: randomUUID(),
      title: data.title,
      description: data.description,
      createdAt: now,
      updatedAt: now
    };

    taskStore.unshift(task);
    return task;
  },

  update(data: UpdateTaskData) {
    const task = taskStore.find((item) => item.id === data.id);

    if (!task) {
      return null;
    }

    task.title = data.title;
    task.description = data.description;
    task.updatedAt = Date.now();

    return task;
  },

  delete(id: string) {
    const taskIndex = taskStore.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      return false;
    }

    taskStore.splice(taskIndex, 1);
    return true;
  }
};
