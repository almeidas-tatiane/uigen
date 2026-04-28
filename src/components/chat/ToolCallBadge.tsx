"use client";

import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  isComplete: boolean;
}

function getFilename(path: unknown): string | null {
  if (typeof path !== "string" || !path) return null;
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

export function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename = getFilename(args.path);

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return filename ? `Creating ${filename}` : "Creating file";
      case "str_replace":
      case "insert":
        return filename ? `Editing ${filename}` : "Editing file";
      case "view":
        return filename ? `Reading ${filename}` : "Reading file";
      default:
        return filename ? `Editing ${filename}` : "Editing file";
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const newFilename = getFilename(args.new_path);
        return filename && newFilename
          ? `Renaming ${filename} to ${newFilename}`
          : "Renaming file";
      }
      case "delete":
        return filename ? `Deleting ${filename}` : "Deleting file";
      default:
        return "Managing file";
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, isComplete }: ToolCallBadgeProps) {
  const label = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" aria-label="loading" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
