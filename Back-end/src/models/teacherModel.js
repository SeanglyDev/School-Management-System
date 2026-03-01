// src/models/teacherModel.js
const mongoose = require("mongoose");
const teacherSchema = new mongoose.Schema(
    {
        profile:   { type: String, default: null },               // filename from uploads/
        fullName:  { type: String, required: true, trim: true },
        email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone:     { type: String, trim: true },
        subject:   { type: String, trim: true },                  // keep if you still use a text subject
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
        classId:   { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
        hireDate:  { type: Date, default: Date.now },
        isActive:  { type: Boolean, default: true },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Teacher", teacherSchema);
