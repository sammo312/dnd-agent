"use client";

import dynamic from "next/dynamic";

const WorkbenchLayout = dynamic(
  () => import("@/components/workbench-layout").then((m) => m.WorkbenchLayout),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-lg animate-pulse">
          Loading...
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return <WorkbenchLayout />;
}
