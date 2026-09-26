import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { LoginInput, SignupInput } from "@stocksense/shared"

type User = {
  id: string;
  email: string;
  fullName: string;
  loginId: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (data: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Safely parse JSON from a fetch Response; returns null on empty body or parse error */
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Not authenticated");
        const data = await safeJson(res);
        if (data?.user) setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (data: LoginInput) => {
    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      throw new Error("Cannot reach server — make sure it is running on port 3001");
    }

    const result = await safeJson(res);
    if (!res.ok) {
      throw new Error(result?.error?.message || "Invalid Login Id or Password");
    }
    if (!result?.user) throw new Error("Cannot reach server");
    setUser(result.user);
  };

  const signup = async (data: SignupInput) => {
    let res: Response;
    try {
      res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      throw new Error("Cannot reach server — make sure it is running on port 3001");
    }

    const result = await safeJson(res);
    if (!res.ok) {
      if (result?.error?.fields) {
        const messages = Object.values(result.error.fields).flat().join(", ");
        throw new Error(messages || "Validation failed");
      }
      throw new Error(result?.error?.message || "Failed to sign up");
    }
    if (!result?.user) throw new Error("Cannot reach server");
    setUser(result.user);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
