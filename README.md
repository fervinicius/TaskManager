# Task Manager

A small full-stack task manager built with **Next.js 15 App Router**, **React 19**, **TypeScript**, **tRPC v11**, **TanStack Query**, and **Zod**.

The application supports task creation, listing, editing, and deletion. The initial task page is rendered on the server. Client Components handle form interaction, mutations, feedback, and infinite scrolling.

> **Important limitation:** tasks are stored in process memory. They disappear when the server process restarts, and separate server instances do not share the same array. This is intentional for the exercise, not a production persistence strategy.

## Features

- Create a task with a required title and optional description.
- List tasks with a cursor-based pagination procedure.
- Edit an existing task.
- Delete a task with a confirmation prompt and success/error feedback.
- Validate data on both the client and server.
- Return meaningful tRPC errors for missing tasks and invalid input.
- Render the first page on the server and hydrate it as the initial client query data.
- Load additional tasks with an `IntersectionObserver` (with a manual **Load more** fallback).
- Seed 15 sample tasks so pagination can be tested immediately.

## Requirements

- Node.js 20.9 or newer (recommended for Next.js 15).
- npm 10 or newer.

## Installation and execution

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Open the application
# http://localhost:3000
```

Production check:

```bash
npm run typecheck
npm run build
npm start
```

## Application architecture

```text
src/
├── app/
│   ├── api/trpc/[trpc]/route.ts  # tRPC HTTP adapter (GET and POST)
│   ├── tasks/new/page.tsx        # Create-task route
│   ├── tasks/[id]/edit/page.tsx  # Edit-task route
│   ├── page.tsx                  # SSR task list
│   ├── layout.tsx                # Root layout and providers
│   └── globals.css
├── components/
│   ├── task-form.tsx             # Client-side create/edit form
│   ├── task-list.tsx             # Client-side list, delete, infinite scroll
│   └── trpc-provider.tsx         # tRPC and TanStack Query providers
├── lib/
│   ├── constants.ts
│   └── format-date.ts
└── server/
    ├── db/in-memory-store.ts     # Process-local in-memory state and seed data
    ├── repositories/task.repository.ts
    ├── routers/task.router.ts    # Input validation and CRUD procedures
    ├── routers/_app.ts           # Root router and AppRouter type
    └── trpc.ts                   # tRPC initialization and context
```

### Request flow

1. The browser requests `/`.
2. `src/app/page.tsx` runs as a Server Component and calls the tRPC router directly through `appRouter.createCaller(...)`. This avoids an unnecessary HTTP request from the server to itself.
3. The first page of tasks is passed to `TaskList`. The Client Component uses it as the `initialData` for the tRPC infinite query, so the initial HTML already contains task content.
4. When the user creates, edits, or deletes a task, the client calls the corresponding tRPC mutation through `/api/trpc`.
5. The server validates the input, calls the repository, and returns a typed result or a tRPC error.
6. TanStack Query invalidates the task-list query after deletion. Creating or editing navigates back to `/`, which requests fresh server-rendered data.

## Data model

```ts
interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: number; // Unix timestamp in milliseconds
  updatedAt: number; // Unix timestamp in milliseconds
}
```

The exercise asks for a creation timestamp. `updatedAt` is an additional field that makes edits observable and is useful in a real application.

## tRPC procedures

All procedures are grouped under `task` in the root router.

| Procedure | Kind | Input | Purpose |
| --- | --- | --- | --- |
| `task.list` | Query | `{ limit, cursor }` | Returns a page of tasks and an optional next cursor |
| `task.getById` | Query | `{ id }` | Returns one task or `NOT_FOUND` |
| `task.create` | Mutation | `{ title, description? }` | Creates a task |
| `task.update` | Mutation | `{ id, title, description? }` | Updates a task or returns `NOT_FOUND` |
| `task.delete` | Mutation | `{ id }` | Deletes a task or returns `NOT_FOUND` |

The `list` procedure uses an offset cursor because the backing data is a simple array. A database-backed implementation should use stable cursor pagination based on an indexed, deterministic field (for example, `(createdAt, id)`) and should define how concurrent inserts/deletes affect page traversal.

### Validation and errors

- `title` is trimmed and must contain at least one character. It is limited to 120 characters.
- `description` is optional and limited to 500 characters.
- `id` must be a UUID.
- Missing tasks produce a tRPC `NOT_FOUND` error.
- The form also checks the title before submitting, but server validation remains authoritative because client-side validation can be bypassed.

## How to test manually

1. Run `npm run dev` and open `http://localhost:3000`.
2. Confirm that the sample tasks are present in the initial server-rendered list.
3. Scroll down. The next page should load when the sentinel enters the viewport. The **Load more** button is a fallback.
4. Select **New task**, submit a title and optional description, and confirm that the new task appears at the top.
5. Try submitting a blank title. The form should show a validation message and should not send the mutation.
6. Edit a task and confirm that the title/description are updated.
7. Delete a task and confirm that a success message is displayed and the list refreshes.
8. Open a made-up UUID at `/tasks/<uuid>/edit`. The application should display the not-found page.
9. To verify backend validation independently of the form, call the tRPC mutation with a blank title using a tRPC client or API testing tool. The server must reject it even if the browser-side check is bypassed.

## Decisions and assumptions

- **Next.js 15 App Router:** Server Components are used for initial data loading; Client Components are limited to interactive experiences.
- **Direct server caller for SSR:** the page calls the same router directly on the server rather than making an HTTP request from the server to its own API route.
- **tRPC v11 + TanStack Query:** tRPC provides end-to-end TypeScript inference; TanStack Query provides caching, mutation state, invalidation, and infinite-query behavior.
- **Zod validation:** input is validated at the server boundary. Browser validation is only a user-experience improvement.
- **Repository boundary:** router procedures do not manipulate the array directly; the repository owns in-memory data access.
- **Seed data:** sample tasks make list rendering and pagination visible on first launch.
- **No authentication:** all procedures are public because authentication is outside the scope of this exercise.
- **No persistence:** the process-local array is only suitable for a local demonstration. Use a shared database (for example PostgreSQL) for real deployments.
- **Single app, not a full monorepo:** this challenge has one deployable application, so a separate workspace tool would add complexity without a second app or shared package. The `server`, `components`, and `app` boundaries keep the code ready to be extracted into `apps/web` and `packages/*` later if the repository grows.

## Suggested next improvements

- Replace the in-memory repository with PostgreSQL and a data-access layer (for example, Drizzle or Prisma).
- Add authentication and per-user authorization before exposing private tasks.
- Add automated unit tests for the repository and router, plus component and end-to-end tests.
- Replace offset pagination with a stable database cursor.
- Add task status, due dates, sorting, filtering, and optimistic updates.
- Add structured logging, rate limiting, and production error monitoring.

## Technical references

- Next.js 15 documentation: https://nextjs.org/docs/15
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Route Handlers: https://nextjs.org/docs/15/app/api-reference/file-conventions/route
- tRPC Next.js App Router setup: https://trpc.io/docs/client/nextjs/app-router-setup
- tRPC routers: https://trpc.io/docs/server/routers
- tRPC React Query integration: https://trpc.io/docs/client/react/setup
- tRPC infinite queries: https://trpc.io/docs/client/react/useInfiniteQuery
- Zod: https://zod.dev/
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/overview

## MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.