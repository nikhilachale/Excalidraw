"use client";

import { useState, useEffect } from "react";
import { backend_url } from "../../config";
import axios from "axios";

export function useInfo() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    async function getUserInfo() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${backend_url}/userinfo`, {
          headers: {
            Authorization: token,
          },
        });
        setInfo(response.data.user);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    }

    getUserInfo();
  }, []);

  return { loading, info };
}