"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationBadgeProps {
  toolInvocation: {
    toolName: string;
    args: Record<string, any>;
    state: string;
    result?: unknown;
  };
}

function getLabel(toolName: string, args: Record<string, any>): string {
  const filename = args.path ? args.path.split("/").pop() : null;

  if (toolName === "str_replace_editor") {
    const actionMap: Record<string, string> = {
      create: "Creating",
      str_replace: "Editing",
      insert: "Editing",
      view: "Viewing",
      undo_edit: "Undoing edit in",
    };
    const action = actionMap[args.command] ?? "Editing";
    return filename ? `${action} ${filename}` : action;
  }

  if (toolName === "file_manager") {
    if (args.command === "delete") {
      return filename ? `Deleting ${filename}` : "Deleting file";
    }
    if (args.command === "rename") {
      const newFilename = args.new_path ? args.new_path.split("/").pop() : null;
      return newFilename ? `Renaming to ${newFilename}` : "Renaming file";
    }
  }

  return toolName.replace(/_/g, " ");
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const label = getLabel(toolName, args);
  const isComplete = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
