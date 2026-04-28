import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// getLabel unit tests

test("getLabel: str_replace_editor create returns Creating with filename", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "/src/App.jsx" })).toBe("Creating App.jsx");
});

test("getLabel: str_replace_editor create without path returns fallback", () => {
  expect(getLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getLabel: str_replace_editor str_replace returns Editing with filename", () => {
  expect(getLabel("str_replace_editor", { command: "str_replace", path: "/src/components/Card.tsx" })).toBe("Editing Card.tsx");
});

test("getLabel: str_replace_editor insert returns Editing with filename", () => {
  expect(getLabel("str_replace_editor", { command: "insert", path: "/src/styles.css" })).toBe("Editing styles.css");
});

test("getLabel: str_replace_editor view returns Reading with filename", () => {
  expect(getLabel("str_replace_editor", { command: "view", path: "/src/index.tsx" })).toBe("Reading index.tsx");
});

test("getLabel: str_replace_editor unknown command returns Editing fallback", () => {
  expect(getLabel("str_replace_editor", { command: "undo_edit", path: "/src/App.jsx" })).toBe("Editing App.jsx");
});

test("getLabel: file_manager rename returns Renaming with both filenames", () => {
  expect(getLabel("file_manager", { command: "rename", path: "/src/Old.jsx", new_path: "/src/New.jsx" })).toBe("Renaming Old.jsx to New.jsx");
});

test("getLabel: file_manager rename without new_path returns fallback", () => {
  expect(getLabel("file_manager", { command: "rename", path: "/src/Old.jsx" })).toBe("Renaming file");
});

test("getLabel: file_manager delete returns Deleting with filename", () => {
  expect(getLabel("file_manager", { command: "delete", path: "/src/temp.js" })).toBe("Deleting temp.js");
});

test("getLabel: file_manager delete without path returns fallback", () => {
  expect(getLabel("file_manager", { command: "delete" })).toBe("Deleting file");
});

test("getLabel: unknown tool returns tool name", () => {
  expect(getLabel("some_other_tool", { command: "run" })).toBe("some_other_tool");
});

test("getLabel: handles deeply nested path", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "/a/b/c/Component.tsx" })).toBe("Creating Component.tsx");
});

// ToolCallBadge component rendering tests

test("renders label text", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/src/App.jsx" }} isComplete={false} />);
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("renders spinner when not complete", () => {
  const { container } = render(
    <ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/src/App.jsx" }} isComplete={false} />
  );
  expect(container.querySelector('[aria-label="loading"]')).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("renders green dot when complete", () => {
  const { container } = render(
    <ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/src/App.jsx" }} isComplete={true} />
  );
  const dot = container.querySelector(".bg-emerald-500");
  expect(dot).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("renders Editing label for str_replace command", () => {
  render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "str_replace", path: "/src/Card.tsx" }} isComplete={true} />);
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("renders Renaming label for file_manager rename", () => {
  render(<ToolCallBadge toolName="file_manager" args={{ command: "rename", path: "/src/Old.jsx", new_path: "/src/New.jsx" }} isComplete={false} />);
  expect(screen.getByText("Renaming Old.jsx to New.jsx")).toBeDefined();
});

test("renders Deleting label for file_manager delete", () => {
  render(<ToolCallBadge toolName="file_manager" args={{ command: "delete", path: "/src/temp.js" }} isComplete={true} />);
  expect(screen.getByText("Deleting temp.js")).toBeDefined();
});

test("falls back to tool name for unknown tool", () => {
  render(<ToolCallBadge toolName="unknown_tool" args={{}} isComplete={false} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});
