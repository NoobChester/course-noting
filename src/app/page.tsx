import React, { Suspense } from "react";
import { IngestionWorkspace } from "@/components/ingestion/IngestionWorkspace";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-sm text-zinc-400">
          Loading lecture ingestion workspace...
        </div>
      }
    >
      <IngestionWorkspace />
    </Suspense>
  );
}
