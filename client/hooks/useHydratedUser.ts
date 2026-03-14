"use client";

import { useEffect, useState } from "react";

import { User } from "@/types";
import { hydrateUser } from "@/services/auth.service";
import { getSession } from "@/services/session.service";

export const useHydratedUser = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(getSession()?.user || null);

  useEffect(() => {
    const run = async () => {
      try {
        const hydrated = await hydrateUser();
        setUser(hydrated);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return { loading, user, setUser };
};
