import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthApiError } from "@/lib/auth";

const { signIn, signUp } = vi.hoisted(() => ({ signIn: vi.fn(), signUp: vi.fn() }));

vi.mock("@/lib/AuthContext", () => ({
  useAuth: () => ({ signIn, signUp, status: "anonymous", user: null, signOut: vi.fn() }),
}));

beforeEach(() => {
  signIn.mockReset();
  signUp.mockReset();
});

function fillAndSubmit(mode: "signin" | "signup") {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@example.com" } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
  fireEvent.click(screen.getByRole("button", { name: mode === "signin" ? "Sign in" : "Sign up" }));
}

describe("AuthForm", () => {
  it("calls signIn with the entered credentials in signin mode", async () => {
    signIn.mockResolvedValue({ id: 1, email: "a@example.com", createdAt: "2026-08-02T00:00:00" });
    const onSuccess = vi.fn();
    render(<AuthForm mode="signin" onSuccess={onSuccess} />);

    fillAndSubmit("signin");

    await waitFor(() => expect(signIn).toHaveBeenCalledWith("a@example.com", "password123"));
    expect(onSuccess).toHaveBeenCalled();
  });

  it("calls signUp with the entered credentials in signup mode", async () => {
    signUp.mockResolvedValue({ id: 2, email: "a@example.com", createdAt: "2026-08-02T00:00:00" });
    render(<AuthForm mode="signup" />);

    fillAndSubmit("signup");

    await waitFor(() => expect(signUp).toHaveBeenCalledWith("a@example.com", "password123"));
  });

  it("shows the error message and does not call onSuccess on failure", async () => {
    signIn.mockRejectedValue(new AuthApiError(401, "Incorrect email or password"));
    const onSuccess = vi.fn();
    render(<AuthForm mode="signin" onSuccess={onSuccess} />);

    fillAndSubmit("signin");

    expect(await screen.findByText("Incorrect email or password")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("renders the footer slot", () => {
    render(<AuthForm mode="signin" footer={<span>custom footer</span>} />);
    expect(screen.getByText("custom footer")).toBeInTheDocument();
  });
});
