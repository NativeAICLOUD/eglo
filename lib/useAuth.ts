"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  apiService,
  AuthResponse,
  isApiError,
} from "./api";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles?: string[];
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialized: boolean; // true after first token check completes — never resets
  error: string | null;
};

// Safe JWT decode (client only)
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    initialized: false,
    error: null,
  });

  const router = useRouter();
  const { locale } = useParams() as { locale: string };

  // Initialize from localStorage
  useEffect(() => {
    const token = apiService.getToken();
    if (!token) {
      setAuth((s) => ({ ...s, isAuthenticated: false, isLoading: false, initialized: true }));
      return;
    }

    const decoded = decodeJWT(token);
    if (!decoded) {
      apiService.removeToken();
      apiService.removeUserEmail();
      setAuth((s) => ({ ...s, isAuthenticated: false, isLoading: false, initialized: true }));
      return;
    }

    // Use the email saved at login time — JWT claim names vary by .NET configuration
    // and can fall through to the sub (GUID) if the claim key doesn't match.
    const storedEmail = apiService.getUserEmail();
    const jwtEmail =
      (decoded["email"] as string | undefined) ??
      (decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] as string | undefined) ??
      (decoded["unique_name"] as string | undefined) ??
      (decoded["name"] as string | undefined);
    const email = storedEmail ?? jwtEmail ?? "unknown@example.com";

    const id =
      (decoded["nameid"] as string) ??
      (decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] as string) ??
      (decoded["sub"] as string) ??
      "unknown";

    const rolesRaw = decoded["role"]
      ?? decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    const roles =
      Array.isArray(rolesRaw)
        ? (rolesRaw as string[])
        : typeof rolesRaw === "string"
        ? [rolesRaw]
        : [];

    setAuth({
      user: { id, email, firstName: "", lastName: "", phone: "", roles },
      isAuthenticated: true,
      isLoading: false,
      initialized: true,
      error: null,
    });
  }, []);

  // Login
  const login = useCallback(
    async ({
      email,
      password,
      rememberMe,
    }: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => {
      setAuth((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const res: AuthResponse = await apiService.login({
          email,
          password,
          rememberMe,
        });
        apiService.setToken(res.token);
        // Persist email so page reloads don't need to guess JWT claim names
        apiService.setUserEmail(res.user.email);

        // Decode JWT to get roles — backend may not include them in the response body
        const decoded   = decodeJWT(res.token)
        // .NET Identity may use full claim URI or short "role" key
        const rolesRaw  = decoded?.["role"]
          ?? decoded?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
        const roles: string[] = Array.isArray(rolesRaw)
          ? rolesRaw
          : typeof rolesRaw === "string"
          ? [rolesRaw]
          : res.user.roles ?? []

        setAuth({
          user: { ...res.user, roles },
          isAuthenticated: true,
          isLoading: false,
          initialized: true,
          error: null,
        });
        const isAdmin = roles.some(r => ["superadmin", "admin"].includes(r.toLowerCase()))
        router.push(isAdmin ? `/${locale}/dashboard` : `/${locale}`)
        return res;
      } catch (err: unknown) {
        const msg = isApiError(err) ? err.message : "Login failed. Please try again.";
        setAuth((s) => ({ ...s, isLoading: false, error: msg }));
        throw err;
      }
    },
    [router, locale]
  );

  // Signup
  const signup = useCallback(
    async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      setAuth((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const res = await apiService.signup({
          email,
          password,
        });
        setAuth((s) => ({ ...s, isLoading: false, error: null }));
        router.push(`/${locale}/login`);
        return res;
      } catch (err: unknown) {
        const msg = isApiError(err) ? err.message : "Signup failed. Please try again.";
        setAuth((s) => ({ ...s, isLoading: false, error: msg }));
        throw err;
      }
    },
    [router, locale]
  );

  // Logout
  const logout = useCallback(() => {
    try {
      apiService.logout();
    } finally {
      apiService.removeToken();
      apiService.removeUserEmail();
      setAuth({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initialized: true,
        error: null,
      });
      router.push(`/${locale}/login`);
    }
  }, [router, locale]);

  const clearError = useCallback(() => {
    setAuth((s) => ({ ...s, error: null }));
  }, []);

  return { ...auth, login, signup, logout, clearError };
}
