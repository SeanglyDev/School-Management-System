import React, { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_URL } from "../API/config";

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const stored = localStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const location = useLocation();
    const navigate = useNavigate();
    const apiHost = API_URL.replace(/\/api\/?$/, "");

    useEffect(() => {
        try {
            const stored = localStorage.getItem("user");
            setCurrentUser(stored ? JSON.parse(stored) : null);
        } catch (err) {
            console.error("Unable to read user info:", err);
        }
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            const { isConfirmed } = await Swal.fire({
                title: "Sign out?",
                text: "You will need to log in again to access the dashboard.",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, logout",
                cancelButtonText: "Stay",
                confirmButtonColor: "#4f46e5",
            });

            if (!isConfirmed) {
                return;
            }

            // remove stored session tokens (if any)
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            localStorage.removeItem("user");
            setCurrentUser(null);

            Swal.fire({
                position: "center",
                icon: "success",
                title: "See you soon!",
                showConfirmButton: false,
                timer: 1200,
            });

            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
            Swal.fire("Error", "Unable to logout. Please try again.", "error");
        }
    };

    const resolveAvatarSrc = () => {
        const raw = currentUser?.profile;
        if (!raw) return profile;
        if (typeof raw === "string" && raw.startsWith("http")) return raw;
        const safeBase = apiHost.replace(/\/$/, "");
        const safePath = String(raw).replace(/^\/+/, "");
        return `${safeBase}/uploads/${safePath}`;
    };

    return (
        <>
            {/* Mobile Top Bar */}
            <header className="bg-indigo-900 text-white p-4 flex items-center justify-between md:hidden fixed top-0 left-0 w-full z-30">
                <button onClick={() => setMenuOpen(true)} className="text-2xl">
                    ☰
                </button>
                <h1 className="font-bold text-lg">School Dashboard</h1>
                <img
                    src={resolveAvatarSrc()}
                    alt={currentUser?.name || currentUser?.fullName || "profile"}
                    className="w-8 h-8 rounded-full object-cover border border-indigo-50 bg-white"
                    onError={(e) => {
                        e.currentTarget.src = profile;
                    }}
                />
            </header>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-64 bg-indigo-900 text-white p-4 transform transition-transform duration-300 z-40
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
            >
                <div className="flex items-center justify-between mb-6 mt-12 md:mt-0">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-indigo-300">🏫</span> School Dashboard
                    </h1>
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="md:hidden text-white text-xl focus:outline-none"
                    >
                        ✖
                    </button>
                </div>

                <nav className="overflow-y-auto max-h-[70vh]">
                    <ul className="flex flex-col gap-2">
                        <li>
                            <Link
                                to="/dashboard"
                                onClick={() => setMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md ${location.pathname === "/dashboard"
                                    ? "bg-indigo-700"
                                    : "hover:bg-indigo-800"
                                    } transition-colors duration-300`}
                            >
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/users"
                                onClick={() => setMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md ${location.pathname === "/users"
                                    ? "bg-indigo-700"
                                    : "hover:bg-indigo-800"
                                    } transition-colors duration-300`}
                            >
                                Users
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/students"
                                onClick={() => setMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md ${location.pathname === "/students"
                                    ? "bg-indigo-700"
                                    : "hover:bg-indigo-800"
                                    } transition-colors duration-300`}
                            >
                                Students
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/teachers"
                                onClick={() => setMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md ${location.pathname === "/teachers"
                                    ? "bg-indigo-700"
                                    : "hover:bg-indigo-800"
                                    } transition-colors duration-300`}
                            >
                                Teachers
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/class"
                                onClick={() => setMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md ${location.pathname === "/class"
                                    ? "bg-indigo-700"
                                    : "hover:bg-indigo-800"
                                    } transition-colors duration-300`}
                            >
                                Class
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/subjects"
                                onClick={() => setMenuOpen(false)}
                                className={`block px-3 py-2 rounded-md ${location.pathname === "/subjects"
                                    ? "bg-indigo-700"
                                    : "hover:bg-indigo-800"
                                    } transition-colors duration-300`}
                            >
                                Subjects
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Profile */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <img
                        src={resolveAvatarSrc()}
                        alt={currentUser?.name || currentUser?.fullName || "profile"}
                        className="w-10 h-10 rounded-full object-cover border border-indigo-50 bg-white"
                        onError={(e) => {
                            e.currentTarget.src = profile;
                        }}
                    />
                    <div className="mt-4 ml-2 mb-4">
                        <p className="text-sm font-medium">
                            {currentUser?.name || currentUser?.fullName || "Admin"}
                        </p>
                        <p className="text-xs text-gray-300 mb-2">
                            {currentUser?.email || "admin@school.com"}
                        </p>
                        <button
                            onClick={handleLogout}
                            className="w-[100px] h-[34px] rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-center text-white text-sm font-medium shadow hover:opacity-90 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-40 z-30 md:hidden"
                    onClick={() => setMenuOpen(false)}
                ></div>
            )}
        </>
    );
}
export default Navbar;
