import React, { useState } from "react";
import axios from "axios";
import bg from "../assets/image_user/bg.png";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../API/config";
import Swal from 'sweetalert2'

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            Swal.fire({
                icon: "warning",
                title: "Missing Information",
                text: "Please enter both email and password.",
                confirmButtonColor: "#6366F1", // Indigo
            });
            return;
        }
        try {
            const res = await axios.post(`${API_URL}/users/login`, { email, password });
            Swal.fire({
                icon: "success",
                title: "Login Successful",
                text: res.data.message || "Welcome back!",
                showConfirmButton: false,
                timer: 1500,
            });
            // Save user data
            localStorage.setItem("user", JSON.stringify(res.data.user));

            // Redirect after a small delay so the alert can show first
            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);

        } catch (err) {
            console.error("Login error:", err.response ?? err);
            Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: err.response?.data?.message || "Invalid email or password.",
                confirmButtonColor: "#EF4444", // red
            });
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side (Form) */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-24 bg-white">
                <h1 className="text-2xl font-semibold mb-10 text-gray-800">
                    <span className="inline-flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-600 rounded-sm"></div>
                        School Management System
                    </span>
                </h1>

                <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
                <p className="text-gray-600 mb-8">Please enter your details</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <label className="flex items-center gap-2 text-gray-700">
                            <input type="checkbox" className="accent-purple-600" />
                            Remember for 30 days
                        </label>

                        <Link to="/ForgetPassword">
                            <a href="#" className="text-purple-600 hover:underline">
                                Forgot password
                            </a>
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
                    >
                        Sign in
                    </button>

                    <button
                        type="button"
                        onClick={() => alert("Sign in with Google")}
                        className="w-full border border-gray-300 py-2 rounded-md flex justify-center items-center gap-2 hover:bg-gray-50 transition"
                    >
                        <img
                            src="https://www.svgrepo.com/show/355037/google.svg"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        Sign in with Google
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Don’t have an account?{" "}
                    <Link to="/register">
                        <a href="" className="text-purple-600 hover:underline">
                            Sign up
                        </a>
                    </Link>
                </p>
            </div>
            {/* Right Side (Illustration) */}
            <div className="hidden md:flex w-1/2 bg-purple-100 items-center justify-center">
                <img src={bg} alt="Illustration" className="w-[700px]" />
            </div>
        </div>
    );
}
