"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/buttons/Button";
import Link from "next/link";

export default function StartPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const endpoint = isLogin
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/signin`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/signup`;

        try {
            const payload = isLogin ? { email, password } : { email, password, username };

            const res = await axios.post(endpoint, payload, {
                withCredentials: true
            });

            if (res.status === 200 || res.status === 201) {
                // If login/signup success, redirect to home
                router.push("/");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen bg-[#08090a] text-white flex flex-col justify-center items-center p-4">
            <Link href="/" className="absolute top-8 left-8 text-xl font-bold text-[#eaf2ef] hover:opacity-80">
                ← Back
            </Link>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-xl">
                <div className="flex mb-8 bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${isLogin ? 'bg-[#735cdd] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!isLogin ? 'bg-[#735cdd] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <h2 className="text-3xl font-bold text-center mb-2">
                    {isLogin ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-gray-400 text-center mb-8">
                    {isLogin ? "Enter your details to access your account" : "Get started with SCREEO today"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#735cdd] transition-all"
                                placeholder="johndoe"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#735cdd] transition-all"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#735cdd] transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <Button
                        text={loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
                        colorVariant="purple"
                        sizeVariant="medium"
                        className="w-full justify-center mt-4 h-12"
                        type="submit"
                        disabled={loading}
                    />
                </form>

                <div className="mt-6 flex items-center justify-between">
                    <span className="h-px w-full bg-white/10"></span>
                    <span className="px-3 text-sm text-gray-500 uppercase">Or</span>
                    <span className="h-px w-full bg-white/10"></span>
                </div>

                <button
                    onClick={handleGoogleAuth}
                    className="mt-6 w-full flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-xl py-3 hover:bg-gray-200 transition-all"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                    </svg>
                    Continue with Google
                </button>
            </div>
        </div>
    );
}
