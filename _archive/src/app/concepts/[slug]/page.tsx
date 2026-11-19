import fs from "fs";
import path from "path";
import { ConceptDetailClient } from "./ConceptDetailClient";

export async function generateStaticParams() {
  const publicDataDir = path.join(process.cwd(), "public", "data");
  const slugs = new Set<string>();

  if (fs.existsSync(publicDataDir)) {
    const files = fs.readdirSync(publicDataDir);
    for (const file of files) {
      if (file.endsWith("_base.json")) {
        try {
          const raw = fs.readFileSync(path.join(publicDataDir, file), "utf-8");
          const data = JSON.parse(raw);
          for (const c of data.concepts || []) {
            if (c.slug) slugs.add(c.slug);
          }
        } catch {}
      }
    }
  }

  // Fallbacks if not yet bundled
  if (slugs.size === 0) {
    slugs.add("eigenvalues-and-eigenvectors");
    slugs.add("greens-theorem");
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export default async function ConceptPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ConceptDetailClient slug={slug} />;
}
