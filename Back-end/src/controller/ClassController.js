const mongoose = require("mongoose");
const ClassModel = require("../models/classModel");
ClassModel.syncIndexes();
const hasModel = (name) => !!mongoose.models[name];

const getClasses = async (_req, res) => {
    try {
        let q = ClassModel.find();
        if (hasModel("Teacher")) q = q.populate({ path: "teacher",  select: "fullName email subject" });
        if (hasModel("Student")) q = q.populate({ path: "students", select: "firstName lastName email" });
        const classes = await q.exec();

        res.status(200).json(classes);
    } catch (err) {
        console.error("getClasses error:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

const getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid class ID" });

        let q = ClassModel.findById(id);
        if (hasModel("Teacher")) q = q.populate({ path: "teacher",  select: "fullName email subject" });
        if (hasModel("Student")) q = q.populate({ path: "students", select: "firstName lastName email" });
 
        const cls = await q.exec();
        if (!cls) return res.status(404).json({ message: "Class not found" });
        res.status(200).json(cls);
    } catch (err) {
        console.error("getClassById error:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// POST /api/classes
const createClass = async (req, res) => {
    try {
        const { name, code } = req.body; // or fullName if your model uses that field
        if (!name || !code) {
            return res.status(400).json({ message: "name and code are required" });
        }

        const newClass = new ClassModel(req.body);
        await newClass.save();
        res.status(201).json(newClass);
    } catch (error) {
        console.error("createClass error:", error);
        res.status(400).json({ message: "Could not create class", error: error.message });
    }
};

// PUT /api/classes/:id
const updateClass = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await ClassModel.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Class not found" });

        res.status(200).json(updated);
    } catch (error) {
        console.error("updateClass error:", error);
        res.status(400).json({ message: "Could not update class" });
    }
};

// DELETE /api/classes/:id
const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await ClassModel.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Class not found" });

        res.status(200).json({ message: "Class deleted" });
    } catch (error) {
        console.error("deleteClass error:", error);
        res.status(400).json({ message: "Invalid class ID" });
    }
};

module.exports = {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
};
