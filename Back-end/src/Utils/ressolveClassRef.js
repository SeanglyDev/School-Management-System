// src/utils/resolveClassRef.js
const mongoose = require("mongoose");
const ClassModel = require("../models/classModel");

// Accepts either classId (Mongo _id), classCode, or className
module.exports = async function resolveClassRef({ classId, classCode, className }) {
    // Prefer explicit Mongo _id if provided
    if (classId !== undefined && classId !== null && classId !== "") {
        if (!mongoose.isValidObjectId(classId)) {
            throw new Error("Invalid classId format (must be a Mongo ObjectId string)");
        }
        const cls = await ClassModel.findById(classId);
        if (!cls) throw new Error("classId not found");
        return cls._id;
    }

    // Otherwise try code
    if (classCode) {
        const cls = await ClassModel.findOne({ code: classCode });
        if (!cls) throw new Error("classCode not found");
        return cls._id;
    }

    // Or name
    if (className) {
        const cls = await ClassModel.findOne({ name: className });
        if (!cls) throw new Error("className not found");
        return cls._id;
    }

    // Nothing provided → no link
    return null;
};
