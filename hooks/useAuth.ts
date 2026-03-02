"use client";

import { useEffect, useState } from "react";

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
    const getUserFromCookie = (): AuthUser => {
      if (typeof window !== "undefined") {
        const cookies = document.cookie.split(";");
        const userCookie = cookies.find((cookie) =>
          cookie.trim().startsWith("user_data=")
        );

        if (userCookie) {
          try {
            const userData = userCookie.split("=")[1];
            const user = JSON.parse(decodeURIComponent(userData));
            return {
              ...user,
              isAuthenticated: true,
            };
          } catch (error) {
            console.error("Error parsing user cookie:", error);
          }
        }
      }

      return {
        id: 0,
        name: "",
        email: "",
        role: "guest",
        isAuthenticated: false,
      };
    };

    setAuthData(getUserFromCookie());
  }, []);

  return authData;
}
