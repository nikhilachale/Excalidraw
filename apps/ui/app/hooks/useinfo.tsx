
import axios from "axios";
import { useEffect, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface UserInfo {
  id: string | number;
  name: string;
  email: string;
}

export const useinfo = () => {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<UserInfo | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    let mounted = true;
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get(`${BACKEND}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (!mounted) return;
        setInfo(res.data?.user || null);
      })
      .catch((err) => {
        console.error("Error fetching user info:", err?.response?.data || err.message);
        setInfo(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  return { loading, info };
};