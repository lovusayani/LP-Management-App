import { User } from "@/types";

export { clearSession } from "@/services/session.service";

export const isAdminUser = (user: User | null): boolean => {
  return user?.role === "admin";
};
