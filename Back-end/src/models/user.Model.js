// models/user.Model.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        profile: { type: String, default: null },
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,
            trim: true,
        },
        // Password is hidden from all queries unless explicitly selected.
        password: { type: String, required: true, select: false },
        age: { type: Number, min: 0 },
        gender: { type: String, enum: ["male", "female", "other"], default: "other" },
        phone: { type: String, trim: true },
    },
    { timestamps: true }
);

// Remove sensitive / noisy fields when converting to JSON
UserSchema.set("toJSON", {
    transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model("User", UserSchema);
