"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface User {
    id: string;
    username: string;
    email: string;
}

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/session`, {
                    withCredentials: true
                });

                if (res.data?.message?.isAuthenticated) {
                    setUser(res.data.message.user);
                } else {
                    setUser(null);
                }
            } catch (err) {
                // If 401/403 or network error, assume not logged in
                setUser(null);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return { user, loading, error, setUser };
}
