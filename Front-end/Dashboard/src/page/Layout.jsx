// src/layout/Layout.jsx
import React from "react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <div className="flex ">
            {/* Sidebar/Navbar */}
            <Navbar />

            {/* Main Content */}
            <div className="flex-1 p-6 md:p-10 mt-16 md:mt-0 bg-gray-100 min-h-screen">
                <Outlet /> {/* This renders nested routes */}
            </div>
        </div>
    );
}
