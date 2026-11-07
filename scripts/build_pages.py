#!/usr/bin/env python3
"""
scripts/build_pages.py
Static build pipeline for GitHub Pages deployment.
1. Bundles courses into public/data/*.json
2. Stashes server-only API routes out of src/app/
3. Executes next build with NEXT_EXPORT=true to emit /out
4. Restores API routes for local development
5. Places .nojekyll in /out for GitHub Pages compatibility
"""

import os
import sys
import shutil
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_APP_API = os.path.join(BASE_DIR, "src", "app", "api")
SRC_STASH_API = os.path.join(BASE_DIR, "src", "api_studio")
OUT_DIR = os.path.join(BASE_DIR, "out")

def main():
    print("=== Step 1: Bundling course packs (Demo Only for GitHub Pages) ===")
    bundle_script = os.path.join(BASE_DIR, "scripts", "bundle_packs.py")
    subprocess.run([sys.executable, bundle_script, "--demo-only"], check=True)

    api_stashed = False
    try:
        if os.path.exists(SRC_APP_API):
            print("=== Step 2: Stashing server API routes for static export ===")
            if os.path.exists(SRC_STASH_API):
                shutil.rmtree(SRC_STASH_API)
            shutil.move(SRC_APP_API, SRC_STASH_API)
            api_stashed = True

        print("=== Step 3: Compiling static HTML export with Next.js ===")
        env = os.environ.copy()
        env["NEXT_EXPORT"] = "true"
        
        # Use npx or npm based on OS
        cmd = ["npx.cmd" if os.name == "nt" else "npx", "next", "build"]
        subprocess.run(cmd, cwd=BASE_DIR, env=env, check=True)

        # Place .nojekyll in out/
        if os.path.exists(OUT_DIR):
            nojekyll_file = os.path.join(OUT_DIR, ".nojekyll")
            with open(nojekyll_file, "w") as f:
                f.write("")
            print(f"Created {nojekyll_file} for GitHub Pages.")

        print("\nStatic export successfully generated in /out ready for GitHub Pages!")

    finally:
        if api_stashed and os.path.exists(SRC_STASH_API):
            print("=== Step 4: Restoring server API routes ===")
            if os.path.exists(SRC_APP_API):
                shutil.rmtree(SRC_APP_API)
            shutil.move(SRC_STASH_API, SRC_APP_API)
            print("API routes restored successfully.")

if __name__ == "__main__":
    main()
