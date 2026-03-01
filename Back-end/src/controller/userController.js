// controllers/user.controller.js
const User = require("../models/user.Model");
const bcrypt = require("bcryptjs");
const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");

// A tiny helper to avoid leaking raw errors
const asMessage = (err, fallback = "Server error") =>
    (err && err.message) ? err.message : fallback;

// Make sure all ObjectIds are valid before hitting Mongo
const mustBeObjectId = (id) => mongoose.isValidObjectId(id);

// Resolve where uploads are stored (adjust if your multer config differs)
const uploadsDir = path.join(__dirname, "../uploads");

// =============================
// GET /users
// =============================
const getUsers = async (_req, res) => {
    try {
        // Because password has select:false in the model, it won't be returned.
        const users = await User.find().lean();
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: asMessage(error) });
    }
};

// =============================
// GET /users/:id
// =============================
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mustBeObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: asMessage(error) });
    }
};

// =============================
// PUT /users/:id (full or partial update)
// Supports profile image + password change
// =============================
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mustBeObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const existing = await User.findById(id).select("+password");
        if (!existing) {
            return res.status(404).json({ message: "User not found" });
        }

        const { name, email, password, age, gender, phone } = req.body;

        // Prevent email duplication when changing email
        if (email && email !== existing.email) {
            const taken = await User.findOne({ email: email.toLowerCase().trim() });
            if (taken) {
                return res.status(409).json({ message: "Email already in use" });
            }
        }

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (email !== undefined) updates.email = email.toLowerCase().trim();
        if (age !== undefined) updates.age = age;
        if (gender !== undefined) updates.gender = gender;
        if (phone !== undefined) updates.phone = phone;

        if (password !== undefined && password !== "") {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(password, salt);
        }

        // Handle new profile image
        let oldProfile = null;
        if (req.file && req.file.filename) {
            oldProfile = existing.profile || null; // remember to delete after update
            updates.profile = req.file.filename;
        }

        const updated = await User.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        // Try deleting the old profile (if any) AFTER we successfully updated the doc
        if (oldProfile) {
            const oldPath = path.join(uploadsDir, oldProfile);
            try {
                await fs.unlink(oldPath);
            } catch (_) {
                // Ignore missing files or deletion errors
            }
        }

        return res.status(200).json(updated);
    } catch (error) {
        return res.status(400).json({ message: asMessage(error, "Invalid request") });
    }
};

// =============================
// DELETE /users/:id
// =============================
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mustBeObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const profile = user.profile; // capture before delete
        await User.findByIdAndDelete(id);

        if (profile) {
            const filePath = path.join(uploadsDir, profile);
            try {
                await fs.unlink(filePath);
            } catch (_) {
                // File may not exist; ignore
            }
        }

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: asMessage(error) });
    }
};

// =============================
// POST /users (Register)
// =============================
const createUser = async (req, res) => {
    try {
        const { name, email, password, age, gender, phone } = req.body;
        const profile = req.file ? req.file.filename : null;

        if (!name || !email || !password || !age || !gender || !phone) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            profile,
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            age,
            gender,
            phone: phone.trim(),
        });

        await newUser.save();

        // Thanks to select:false & toJSON, password is not returned
        return res.status(201).json({
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                profile: newUser.profile,
            },
        });
    } catch (error) {
        console.error("❌ Error in createUser:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// =============================
// POST /auth/login
// =============================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        // Need '+password' ONLY here to compare; it stays server-side.
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Remove password before sending any user data out
        const { _id, name, email: cleanEmail, profile } = user.toJSON();
        return res.status(200).json({
            message: "✅ Login successful",
            user: {
                id: _id,
                name,
                email: cleanEmail,
                profile,
            },
        });
    } catch (error) {
        console.error("❌ Error in loginUser:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createUser, loginUser, getUsers, getUserById, updateUser, deleteUser };
