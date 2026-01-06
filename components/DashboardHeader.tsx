// components/DashboardHeader.tsx
"use client";
import { useSession } from "next-auth/react";

export default function DashboardHeader() {
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">
        Hello, {session?.user?.name} 👋
      </h1>
      <p className="text-sm text-indigo-400 font-medium">
        {session?.user?.position || "AnyNet Team"}
      </p>
    </div>
  );
}