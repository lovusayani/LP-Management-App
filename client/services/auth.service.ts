import { ApiError, apiFetch } from "./api";
import { clearSession, getSession, setSession, updateSessionUser } from "./session.service";
import { AuthSession, User } from "@/types";

let inFlightHydration: Promise<User | null> | null = null;

export const loginUser = async (email: string, password: string): Promise<User> => {
  const data = await apiFetch<AuthSession>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  setSession(data);
  return data.user;
};

export const hydrateUser = async (): Promise<User | null> => {
  const session = getSession();
  if (!session?.accessToken) {
    return null;
  }

  if (inFlightHydration) {
    return inFlightHydration;
  }

  inFlightHydration = (async () => {
    try {
      const data = await apiFetch<{ user: User }>("/auth/me", { method: "GET" });
      updateSessionUser(data.user);
      return data.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        return session.user || null;
      }

      clearSession();
      return null;
    } finally {
      inFlightHydration = null;
    }
  })();

  return inFlightHydration;
};

export const changeUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await apiFetch<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });

  const data = await apiFetch<{ user: User }>("/auth/me", { method: "GET" });
  updateSessionUser(data.user);
};

export const logoutUser = async (): Promise<void> => {
  try {
    await apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
  } finally {
    clearSession();
  }
};
