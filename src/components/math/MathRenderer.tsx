"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Split into lines/blocks
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inBlockMath = false;
    let blockMathAccumulator: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect start/end of $$ block
      if (line.trim().startsWith("$$") && !inBlockMath) {
        if (line.trim().endsWith("$$") && line.trim().length > 4) {
          // Single line $$ ... $$
          const formula = line.trim().slice(2, -2);
          elements.push(renderDisplayMath(formula, `block-math-${i}`));
          continue;
        }
        inBlockMath = true;
        blockMathAccumulator = [line.trim().slice(2)];
        continue;
      }

      if (inBlockMath) {
        if (line.trim().endsWith("$$")) {
          blockMathAccumulator.push(line.trim().slice(0, -2));
          const formula = blockMathAccumulator.join("\n");
          elements.push(renderDisplayMath(formula, `block-math-${i}`));
          inBlockMath = false;
          blockMathAccumulator = [];
        } else {
          blockMathAccumulator.push(line);
        }
        continue;
      }

      // Headers
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-lg font-bold text-indigo-400 mt-4 mb-2 flex items-center gap-2">
            {renderInlineMarkdownAndMath(line.slice(4))}
          </h3>
        );
        continue;
      }
      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-xl font-bold text-indigo-300 mt-5 mb-2 border-b border-zinc-800 pb-1">
            {renderInlineMarkdownAndMath(line.slice(3))}
          </h2>
        );
        continue;
      }
      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-2xl font-black text-zinc-100 mt-6 mb-3">
            {renderInlineMarkdownAndMath(line.slice(2))}
          </h1>
        );
        continue;
      }

      // Lists
      if (line.trim().match(/^(\*|-)\s+/)) {
        const itemText = line.trim().replace(/^(\*|-)\s+/, "");
        elements.push(
          <li key={`li-${i}`} className="ml-5 list-disc text-zinc-300 my-1">
            {renderInlineMarkdownAndMath(itemText)}
          </li>
        );
        continue;
      }

      if (line.trim().match(/^\d+\.\s+/)) {
        const itemText = line.trim().replace(/^\d+\.\s+/, "");
        elements.push(
          <li key={`oli-${i}`} className="ml-5 list-decimal text-zinc-300 my-1">
            {renderInlineMarkdownAndMath(itemText)}
          </li>
        );
        continue;
      }

      // Empty line / paragraph separator
      if (!line.trim()) {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        continue;
      }

      // Images markdown ![alt](src)
      const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        elements.push(
          <div key={`img-${i}`} className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 p-2">
            <img src={imgMatch[2]} alt={imgMatch[1] || "Solution attachment"} className="max-h-96 mx-auto rounded object-contain" />
            {imgMatch[1] && <p className="text-center text-xs text-zinc-500 mt-1">{imgMatch[1]}</p>}
          </div>
        );
        continue;
      }

      // Regular paragraph line
      elements.push(
        <p key={`p-${i}`} className="text-zinc-200 leading-relaxed my-1">
          {renderInlineMarkdownAndMath(line)}
        </p>
      );
    }

    return elements;
  }, [content]);

  return <div className={`math-content font-sans text-sm md:text-base ${className}`}>{renderedElements}</div>;
}

function renderDisplayMath(formula: string, key: string) {
  try {
    const html = katex.renderToString(formula, {
      displayMode: true,
      throwOnError: false
    });
    return (
      <div
        key={key}
        className="my-3 p-3 overflow-x-auto rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-center"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return (
      <div key={key} className="my-2 p-2 bg-red-950/40 text-red-400 font-mono text-xs rounded border border-red-800">
        $${formula}$$
      </div>
    );
  }
}

function renderInlineMarkdownAndMath(text: string): React.ReactNode {
  // Regex to split text by inline math: $ ... $
  const tokens = text.split(/(\$[^$]+?\$)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
      const math = token.slice(1, -1);
      try {
        const html = katex.renderToString(math, {
          displayMode: false,
          throwOnError: false
        });
        return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
      } catch {
        return <span key={idx} className="font-mono text-red-400 text-xs">{token}</span>;
      }
    }

    // Bold formatting: **bold**
    if (token.includes("**")) {
      const boldParts = token.split(/(\*\*[^*]+?\*\*)/g);
      return (
        <span key={idx}>
          {boldParts.map((bp, bidx) => {
            if (bp.startsWith("**") && bp.endsWith("**")) {
              return <strong key={bidx} className="font-semibold text-zinc-100">{bp.slice(2, -2)}</strong>;
            }
            return bp;
          })}
        </span>
      );
    }

    return token;
  });
}
