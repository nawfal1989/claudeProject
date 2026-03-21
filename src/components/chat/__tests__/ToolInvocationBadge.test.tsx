import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, any>,
  state: string = "result",
  result: unknown = "Success"
) {
  return { toolName, args, state, result };
}

test("str_replace_editor create shows 'Creating {filename}'", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("str_replace_editor str_replace shows 'Editing {filename}'", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "str_replace", path: "/Card.jsx" })}
    />
  );
  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
});

test("str_replace_editor insert shows 'Editing {filename}'", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "insert", path: "/utils.js" })}
    />
  );
  expect(screen.getByText("Editing utils.js")).toBeDefined();
});

test("str_replace_editor view shows 'Viewing {filename}'", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "view", path: "/index.tsx" })}
    />
  );
  expect(screen.getByText("Viewing index.tsx")).toBeDefined();
});

test("str_replace_editor undo_edit shows 'Undoing edit in {filename}'", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })}
    />
  );
  expect(screen.getByText("Undoing edit in App.jsx")).toBeDefined();
});

test("file_manager delete shows 'Deleting {filename}'", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/old.jsx" })}
    />
  );
  expect(screen.getByText("Deleting old.jsx")).toBeDefined();
});

test("file_manager rename shows 'Renaming to {new_filename}'", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "rename",
        path: "/old.jsx",
        new_path: "/New.jsx",
      })}
    />
  );
  expect(screen.getByText("Renaming to New.jsx")).toBeDefined();
});

test("unknown tool name shows cleaned-up fallback", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("some_tool", {})}
    />
  );
  expect(screen.getByText("some tool")).toBeDefined();
});

test("loading state shows spinner and no green dot", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "call", undefined)}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("complete state shows green dot and no spinner", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result", "Success")}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("missing path renders label without filename and does not crash", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create" })}
    />
  );
  expect(screen.getByText("Creating")).toBeDefined();
});
