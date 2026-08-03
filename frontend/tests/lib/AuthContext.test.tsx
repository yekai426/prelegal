import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

const { fetchCurrentUser, signIn, signUp, signOut } = vi.hoisted(() => ({
  fetchCurrentUser: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ fetchCurrentUser, signIn, signUp, signOut }));

function Consumer() {
  const { status, user, signIn: doSignIn, signOut: doSignOut } = useAuth();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="email">{user?.email ?? ""}</p>
      <button onClick={() => doSignIn("a@example.com", "password123")}>sign in</button>
      <button onClick={() => doSignOut()}>sign out</button>
    </div>
  );
}

beforeEach(() => {
  fetchCurrentUser.mockReset();
  signIn.mockReset();
  signUp.mockReset();
  signOut.mockReset();
});

describe("AuthProvider / useAuth", () => {
  it("starts as loading, then resolves to anonymous when there is no session", async () => {
    fetchCurrentUser.mockResolvedValue(null);
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
  });

  it("resolves to authenticated with the current user when a session exists", async () => {
    fetchCurrentUser.mockResolvedValue({ id: 1, email: "a@example.com", createdAt: "2026-08-02T00:00:00" });
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authenticated"));
    expect(screen.getByTestId("email")).toHaveTextContent("a@example.com");
  });

  it("falls back to anonymous if fetchCurrentUser rejects", async () => {
    fetchCurrentUser.mockRejectedValue(new Error("network error"));
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));
  });

  it("flips to authenticated immediately after a successful signIn call", async () => {
    fetchCurrentUser.mockResolvedValue(null);
    signIn.mockResolvedValue({ id: 2, email: "b@example.com", createdAt: "2026-08-02T00:00:00" });
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("anonymous"));

    await act(async () => {
      screen.getByText("sign in").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("email")).toHaveTextContent("b@example.com");
  });

  it("does not let a slow initial /me lookup clobber a signIn that already resolved", async () => {
    let resolveFetchCurrentUser!: (value: null) => void;
    fetchCurrentUser.mockReturnValue(
      new Promise((resolve) => {
        resolveFetchCurrentUser = resolve;
      }),
    );
    signIn.mockResolvedValue({ id: 2, email: "b@example.com", createdAt: "2026-08-02T00:00:00" });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("status")).toHaveTextContent("loading");

    await act(async () => {
      screen.getByText("sign in").click();
    });
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");

    // The slow /me lookup from mount finally resolves (to "no session") AFTER
    // signIn already settled — it must not revert the now-authenticated state.
    await act(async () => {
      resolveFetchCurrentUser(null);
    });
    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("email")).toHaveTextContent("b@example.com");
  });

  it("flips to anonymous after signOut", async () => {
    fetchCurrentUser.mockResolvedValue({ id: 1, email: "a@example.com", createdAt: "2026-08-02T00:00:00" });
    signOut.mockResolvedValue(undefined);
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authenticated"));

    await act(async () => {
      screen.getByText("sign out").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
  });
});

describe("useAuth outside a provider", () => {
  it("throws a clear error", () => {
    function Bare() {
      useAuth();
      return null;
    }
    expect(() => render(<Bare />)).toThrow("useAuth must be used within an AuthProvider");
  });
});
