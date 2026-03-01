import React, { useState } from "react";
import bg from "../assets/image_user/bg.png";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../API/config";
import Swal from 'sweetalert2'
export default function RegisterPage() {
    const [profile, setProfile] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [phone, setPhone] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !password || !age || !gender || !phone) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Something went wrong!",
                footer: '<a href="#">Why do I have this issue?</a>'
            });
            return;
        }

        try {
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Your work has been saved",
                showConfirmButton: false,
                timer: 1500
            });

            const formData = new FormData();
            if (profile) formData.append("profile", profile);
            formData.append("name", name);
            formData.append("email", email);
            formData.append("password", password);
            formData.append("age", age);
            formData.append("gender", gender);
            formData.append("phone", phone);

            const response = await axios.post(`${API_URL}/users/register`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            console.log(response.data.message);
            setProfile(null);
            setName("");
            setEmail("");
            setPassword("");
            setAge("");
            setGender("");
            setPhone("");
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Server error");
        }
    };


    return (
        <div className="min-h-screen flex">
            {/* Left Side Form */}
            <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-24 bg-white">
                <h1 className="text-2xl font-semibold mb-6 text-gray-800">
                    <span className="inline-flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-600 rounded-sm"></div>
                        School Management System
                    </span>
                </h1>

                <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                <p className="text-gray-600 mb-6">Fill in your information</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Profile Image */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Profile Image
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProfile(e.target.files[0])}
                            className="w-full border border-gray-300 rounded-md p-2"
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Age */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Age
                        </label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="Your age"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gender
                        </label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0123456789"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition"
                    >
                        Register
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-sm text-gray-600 mt-4">
                    Already have an account?{" "}
                    <Link to="/">
                        <a href="" className="text-purple-600 hover:underline">
                            Login
                        </a>
                    </Link>
                </p>
            </div>

            {/* Right Side Illustration */}
            <div className="hidden md:flex w-1/2 bg-purple-100 items-center justify-center">
                <img src={bg} alt="Illustration" className="w-[700px]" />
            </div>
        </div>
    );
}
