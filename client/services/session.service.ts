import { AuthSession, User } from "@/types";

const SESSION_KEY = "lp_auth_session";
const KYC_SKIPPED_KEY = "lp_kyc_skipped";

export const getSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    clearSession();
    return null;
  }
};

export const setSession = (session: AuthSession): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const updateSessionUser = (user: User): void => {
  const existing = getSession();
  if (!existing) {
    return;
  }

  setSession({ ...existing, user });
};

export const clearSession = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(KYC_SKIPPED_KEY);
};

export const markKycSkipped = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(KYC_SKIPPED_KEY, "true");
};

export const clearKycSkipped = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(KYC_SKIPPED_KEY);
};

export const isKycSkipped = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(KYC_SKIPPED_KEY) === "true";
};

export const getNextRoute = (user: User | null): string => {
  if (!user) {
    return "/login";
  }
  if (user.role === "admin") {
    return "/admin";
  }
  if (user.mustChangePassword) {
    return "/reset-password";
  }
  if (!user.onboardingCompleted) {
    return "/onboarding";
  }
  if (!user.kycSubmitted && !isKycSkipped()) {
    return "/kyc";
  }
  return "/dashboard";
};
