import fs from "fs";
import path from "path";
import { QuestionWorkspaceClient } from "./QuestionWorkspaceClient";

export async function generateStaticParams() {
  const publicDataDir = path.join(process.cwd(), "public", "data");
  const ids = new Set<string>();

  if (fs.existsSync(publicDataDir)) {
    const files = fs.readdirSync(publicDataDir);
    for (const file of files) {
      if (file.endsWith("_base.json")) {
        try {
          const raw = fs.readFileSync(path.join(publicDataDir, file), "utf-8");
          const data = JSON.parse(raw);
          for (const q of data.questions || []) {
            if (q.id) ids.add(q.id);
          }
        } catch {}
      }
    }
  }

  // Fallbacks if not yet bundled
  if (ids.size === 0) {
    ids.add("q-001");
    ids.add("q-002");
  }

  return Array.from(ids).map((id) => ({ id }));
}

export default async function QuestionPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuestionWorkspaceClient id={id} />;
}
