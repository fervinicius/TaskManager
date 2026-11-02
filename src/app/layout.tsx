import type { Metadata } from "next";
import { TRPCProvider } from "@/components/trpc-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager | Next.js + tRPC",
  description: "A simple task manager built with Next.js 15, React, TypeScript, and tRPC."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
