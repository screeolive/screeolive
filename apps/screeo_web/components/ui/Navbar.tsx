"use client";

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "./buttons/Button"
import { Phone } from "../icons/Phone"
import { LogOut } from "../icons/LogOut"
import { useUser } from "../../hooks/useUser"

export const Navbar = () => {
    const { user, loading, setUser } = useUser();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/logout`, {}, {
                withCredentials: true
            });
            setUser(null);
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="flex flex-col md:flex-row justify-around items-center">
            <div>
                <Link href={"/"}>
                    <Image
                        src={"/screeo-full.png"}
                        alt="screeo logo"
                        width={200}
                        height={200}
                        className="hover:scale-105 transition-all duration-500"
                    />
                </Link>
            </div>

            <div className="min-h-[48px] flex items-center">
                {loading ? (
                    <div className="w-24 h-10 bg-white/5 animate-pulse rounded-xl"></div>
                ) : user ? (
                    <div className="flex items-center gap-4">
                        <span className="text-gray-300 hidden sm:block">Welcome, {user.username}</span>
                        <Button
                            text="Logout"
                            colorVariant="white"
                            sizeVariant="medium"
                            hoverVariant="white_1"
                            endIcon={<LogOut className="size-5" />}
                            onClick={handleLogout}
                        />
                    </div>
                ) : (
                    <Link href="/start">
                        <Button text="Sign up for free" colorVariant="white" sizeVariant="medium" hoverVariant="white_1" endIcon={<Phone className="size-5" />} />
                    </Link>
                )}
            </div>
        </div>
    )
}