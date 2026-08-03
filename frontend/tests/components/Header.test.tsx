import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/layout/Header";

const { useAuth, usePathname } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("@/lib/AuthContext", () => ({ useAuth }));
vi.mock("next/navigation", () => ({ usePathname }));

beforeEach(() => {
  useAuth.mockReset();
  usePathname.mockReset();
  usePathname.mockReturnValue("/");
});

describe("Header", () => {
  it("shows sign in / sign up links when anonymous", () => {
    useAuth.mockReturnValue({ status: "anonymous", user: null, signOut: vi.fn() });
    render(<Header />);

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/signin");
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });

  it("shows the user's email and a sign-out button when authenticated", () => {
    const signOut = vi.fn();
    useAuth.mockReturnValue({ status: "authenticated", user: { id: 1, email: "a@example.com" }, signOut });
    render(<Header />);

    expect(screen.getByText("a@example.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(signOut).toHaveBeenCalled();
  });

  it("links to both the creator and document history routes", () => {
    useAuth.mockReturnValue({ status: "anonymous", user: null, signOut: vi.fn() });
    render(<Header />);

    expect(screen.getByRole("link", { name: /create/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /my documents/i })).toHaveAttribute("href", "/documents");
  });
});
