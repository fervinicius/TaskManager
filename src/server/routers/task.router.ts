import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { taskRepository } from "@/server/repositories/task.repository";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(120, "Title must contain 120 characters or fewer.");

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description must contain 500 characters or fewer.")
  .optional();

export const taskRouter = createTRPCRouter({
  // Cursor pagination is used by the infinite-scroll experience.
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(20).default(6),
        cursor: z.number().int().min(0).nullish()
      })
    )
    .query(({ input }) => {
      return taskRepository.findPage(input.limit, input.cursor ?? 0);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid("Invalid task identifier.") }))
    .query(({ input }) => {
      const task = taskRepository.findById(input.id);

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      return task;
    }),

  create: publicProcedure
    .input(
      z.object({
        title: titleSchema,
        description: descriptionSchema
      })
    )
    .mutation(({ input }) => {
      return taskRepository.create(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid("Invalid task identifier."),
        title: titleSchema,
        description: descriptionSchema
      })
    )
    .mutation(({ input }) => {
      const updatedTask = taskRepository.update(input);

      if (!updatedTask) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cannot update this task because it does not exist." });
      }

      return updatedTask;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid("Invalid task identifier.") }))
    .mutation(({ input }) => {
      const wasDeleted = taskRepository.delete(input.id);

      if (!wasDeleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cannot delete this task because it does not exist." });
      }

      return { id: input.id, success: true };
    })
});
