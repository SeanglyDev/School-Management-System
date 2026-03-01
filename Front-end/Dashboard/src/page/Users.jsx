// src/pages/Users.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BadgePlus, X } from "lucide-react";
import Swal from "sweetalert2";
import { API_URL } from "../API/config";
import "gasparesganga-jquery-loading-overlay/dist/loadingoverlay.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";
import $ from "jquery";

export default function Users() {
    // ========== Form State ==========
    const [profile, setProfile] = useState(null); // File for upload
    const [existingProfile, setExistingProfile] = useState(""); // existing filename/url when editing
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(""); // optional in edit
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [phone, setPhone] = useState("");

    // ========== UI State ==========
    const [users, setUsers] = useState([]);
    const [open, setOpen] = useState(false);
    const [animateClose, setAnimateClose] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // NEW: edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const API_backend = "http://localhost:3000/api/users";

    // ========== Fetch Users ==========
    const fetchUsers = async () => {
        try {
            const res = await axios.get(API_backend);
            setUsers(res.data);
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            $.LoadingOverlay("hide");
        }
    };
    useEffect(() => {
        $.LoadingOverlay("show", {
            image: "",
            fontawesome: "fa fa-cog fa-spin"
        });
        fetchUsers();


    }, []);

    // ========== Open/Close Popup ==========
    const resetForm = () => {
        setProfile(null);
        setExistingProfile("");
        setName("");
        setEmail("");
        setPassword("");
        setAge("");
        setGender("");
        setPhone("");
    };

    const handleOpenAdd = () => {
        setIsEditing(false);
        setEditingId(null);
        resetForm();
        setOpen(true);
    };

    const handleClose = () => {
        setAnimateClose(true);
        setTimeout(() => {
            setOpen(false);
            setAnimateClose(false);
            setIsEditing(false);
            setEditingId(null);
            resetForm();
        }, 200);
    };

    // ========== Delete ==========
    const handleDelete = async (userId) => {
        const user = users.find((u) => u._id === userId);
        const { isConfirmed } = await Swal.fire({
            title: "Delete this user?",
            text: `This will permanently delete ${user?.name || "the user"}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444",
        });
        if (!isConfirmed) return;

        try {
            setDeletingId(userId);
            await axios.delete(`${API_URL}/users/${userId}`);
            setUsers((prev) => prev.filter((u) => u._id !== userId));
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "User deleted",
                showConfirmButton: false,
                timer: 1400,
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Delete failed",
                text: error.response?.data?.message || "Server error",
            });
        } finally {
            setDeletingId(null);
        }
    };

    // ========== Edit (prefill + open) ==========
    const handleEdit = (user) => {
        setIsEditing(true);
        setEditingId(user._id);

        // Prefill
        setExistingProfile(user.profile || "");
        setProfile(null); // user may upload a new file
        setName(user.name || "");
        setEmail(user.email || "");
        setPassword(""); // keep empty unless changing
        setAge(user.age ?? "");
        setGender(user.gender ?? "");
        setPhone(user.phone ?? "");

        setOpen(true);
    };

    // ========== Add / Edit Save ==========
    const handleSave = async (e) => {
        e.preventDefault();

        // basic validation
        if (!name || !email || !age || !gender || !phone) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Please fill all fields except password (password is optional when editing).",
            });
            return;
        }
        if (!isEditing && !password) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Password is required when creating a user.",
            });
            return;
        }

        try {
            const formData = new FormData();
            if (profile) formData.append("profile", profile); // only if new file chosen
            formData.append("name", name);
            formData.append("email", email);
            if (password) formData.append("password", password); // only send if provided
            formData.append("age", age);
            formData.append("gender", gender);
            formData.append("phone", phone);

            if (isEditing) {
                // Adjust to your backend method/route (PUT vs PATCH)
                await axios.put(`${API_URL}/users/${editingId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "User updated",
                    showConfirmButton: false,
                    timer: 1400,
                });
            } else {
                await axios.post(`${API_URL}/users/register`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "User added successfully",
                    showConfirmButton: false,
                    timer: 1500,
                });
            }

            handleClose();
            // You can do optimistic update, but simplest is to refresh:

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: isEditing ? "Update failed" : "Create failed",
                text: error.response?.data?.message || "Server error",
            });
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen md:ml-64">
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase">
                        User Management
                    </h1>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center justify-center gap-2 w-full md:w-auto px-5 h-[45px] rounded-md bg-amber-400 hover:bg-amber-500 transition-colors font-medium"
                    >
                        <BadgePlus size={18} />
                        <span>Add User</span>
                    </button>
                </div>

                {/* Users Table */}

                <div>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                            <table className="w-full min-w-[850px] text-center border border-gray-200">
                                <thead className="bg-indigo-100 text-indigo-900 text-sm md:text-base font-semibold uppercase tracking-wide">
                                    <tr>
                                        <th className="p-3">Profile</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Created At</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-700 text-sm md:text-base">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3">
                                                <img
                                                    src={user.profile ? `http://localhost:3000/uploads/${user.profile}` : ""}
                                                    alt={user.name}
                                                    className="w-[55px] h-[55px] object-cover mx-auto rounded-full"
                                                />
                                            </td>
                                            <td className="p-3 font-semibold">{user.name}</td>
                                            <td className="p-3">{user.email}</td>

                                            <td className="p-3">
                                                <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">{user.role || "User"}</span>
                                            </td>
                                            <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="p-3 flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    disabled={deletingId === user._id}
                                                    className={`px-3 py-1.5 text-white rounded-md text-sm ${deletingId === user._id ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
                                                        }`}
                                                >
                                                    {deletingId === user._id ? "Deleting..." : "Delete"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {users.map((user) => (
                            <div key={user._id} className="bg-white p-4 rounded-lg shadow-sm flex items-start gap-4">
                                <img
                                    src={user.profile ? `http://localhost:3000/uploads/${user.profile}` : ""}
                                    alt={user.name}
                                    className="w-[55px] h-[55px] object-cover mx-auto rounded-full"
                                />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    <p className="text-xs text-gray-400">
                                        Password: {user.password ? "••••" : "—"}
                                    </p>
                                    <p className="mt-1 text-sm text-indigo-700 font-medium">Role: {user.role || "User"}</p>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user._id)}
                                            disabled={deletingId === user._id}
                                            className={`flex-1 px-3 py-2 text-white rounded-md text-sm ${deletingId === user._id ? "bg-red-300 cursor-not-allowed" : "bg-red-500"
                                                }`}
                                        >
                                            {deletingId === user._id ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add/Edit Popup */}
                {open && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
                        onClick={handleClose}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className={`w-[1000px] bg-white rounded-2xl shadow-2xl p-6 border border-gray-200 transform ${animateClose ? "opacity-0 scale-90 transition-all duration-200" : "animate-popupDesktop"
                                }`}
                        >
                            <div className="flex justify-between items-center border-b pb-3">
                                <h2 className="text-xl font-semibold">{isEditing ? "Edit User" : "Add User"}</h2>
                                <X className="cursor-pointer hover:text-red-500 transition" onClick={handleClose} />
                            </div>

                            <form onSubmit={handleSave} className="space-y-4 mt-4">
                                {/* Profile */}
                                <div>
                                    <label className="block text-md font-medium text-gray-700 mb-1">Profile</label>
                                    <div className="flex items-center gap-4">
                                        {(existingProfile || profile) && (
                                            <img
                                                src={
                                                    profile
                                                        ? URL.createObjectURL(profile)
                                                        : existingProfile
                                                            ? `http://localhost:3000/uploads/${existingProfile}`
                                                            : ""
                                                }
                                                alt="preview"
                                                className="w-[55px] h-[55px] object-cover rounded-full border"
                                            />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setProfile(e.target.files[0])}
                                            className="w-full border border-gray-300 rounded-md p-2"
                                        />
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-md font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-md font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-md font-medium text-gray-700 mb-1">
                                        {isEditing ? "New Password (optional)" : "Password"}
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={isEditing ? "Leave blank to keep current password" : ""}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Age */}
                                <div>
                                    <label className="block text-md font-medium text-gray-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-md font-medium text-gray-700 mb-1">Gender</label>
                                    <select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-[300px] border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 md:w-full"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-md font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white py-2 rounded-md mt-3 hover:bg-indigo-700 transition"
                                >
                                    {isEditing ? "Save Changes" : "Save User"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
