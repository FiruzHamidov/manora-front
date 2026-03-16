"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "@/services/login/storage";
import type { User } from "@/services/login/types";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
}

export function useAuth(): AuthUser {
  const [authData, setAuthData] = useState<AuthUser>({
    id: 0,
    name: "",
    email: "",
    role: "guest",
    isAuthenticated: false,
  });

  useEffect(() => {
    const getStoredAuthUser = (): AuthUser => {
      const user = getStoredUser() as User | null;
      if (user) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role?.slug || "user",
          isAuthenticated: true,
        };
      }

      return {
        id: 0,
        name: "",
        email: "",
        role: "guest",
        isAuthenticated: false,
      };
    };

    setAuthData(getStoredAuthUser());
  }, []);

  return authData;
}
