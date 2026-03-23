import { test, expect, vi, afterEach, beforeEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
  useFileSystem: vi.fn(() => ({
    getAllFiles: vi.fn(() => new Map()),
    refreshTrigger: 0,
    fileSystem: { getNode: vi.fn(() => null) },
    selectedFile: null,
    setSelectedFile: vi.fn(),
    getFileContent: vi.fn(),
    updateFile: vi.fn(),
  })),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  })),
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">CodeEditor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">PreviewFrame</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">HeaderActions</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("MainContent tab toggle", () => {
  test("shows preview tab as active by default", () => {
    render(<MainContent />);
    const previewTab = screen.getByRole("tab", { name: "Preview" });
    expect(previewTab.getAttribute("data-state")).toBe("active");
  });

  test("shows code tab as inactive by default", () => {
    render(<MainContent />);
    const codeTab = screen.getByRole("tab", { name: "Code" });
    expect(codeTab.getAttribute("data-state")).toBe("inactive");
  });

  test("shows PreviewFrame by default", () => {
    render(<MainContent />);
    expect(screen.getByTestId("preview-frame")).toBeDefined();
  });

  test("hides CodeEditor when in preview view", () => {
    render(<MainContent />);
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("switches to code view when Code tab is clicked", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));

    expect(screen.getByRole("tab", { name: "Code" }).getAttribute("data-state")).toBe("active");
    expect(screen.getByTestId("code-editor")).toBeDefined();
  });

  test("hides PreviewFrame when in code view", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));

    expect(screen.queryByTestId("preview-frame")).toBeNull();
  });

  test("switches back to preview when Preview tab is clicked after switching to code", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    await user.click(screen.getByRole("tab", { name: "Code" }));
    await user.click(screen.getByRole("tab", { name: "Preview" }));

    expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("data-state")).toBe("active");
    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });

  test("can toggle between preview and code multiple times", async () => {
    const user = userEvent.setup();
    render(<MainContent />);

    // Start: preview
    expect(screen.getByTestId("preview-frame")).toBeDefined();

    // Switch to code
    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByTestId("code-editor")).toBeDefined();
    expect(screen.queryByTestId("preview-frame")).toBeNull();

    // Switch back to preview
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("code-editor")).toBeNull();

    // Switch to code again
    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(screen.getByTestId("code-editor")).toBeDefined();
    expect(screen.queryByTestId("preview-frame")).toBeNull();
  });
});
