const mongoose = require('mongoose');
const Teacher = require("../models/teacherModel");
const ClassModel = require("../models/classModel");
const hasModel = (name) => !!mongoose.models[name];
const SubjectModel = require("../models/subjectModel");
// optional: only if you actually have Subject
async function resolveClassRef({ classId, classCode, className }) {
    if (classId) {
        if (!mongoose.isValidObjectId(classId)) throw new Error("Invalid classId");
        const c = await ClassModel.findById(classId);
        if (!c) throw new Error("classId not found");
        return c._id;
    }
    if (classCode) {
        const c = await ClassModel.findOne({ code: classCode });
        if (!c) throw new Error(`classCode "${classCode}" not found`);
        return c._id;
    }
    if (className) {
        const c = await ClassModel.findOne({ name: className });
        if (!c) throw new Error(`className "${className}" not found`);
        return c._id;
    }
    return null;
}

// GET /api/teachers
const getTeachers = async (_req, res) => {
    try {
        let q = Teacher.find()
            .populate({ path: "classId", select: "name code room" });
        if (hasModel("Subject")) {
            q = q.populate({ path: "subjectId", select: "name code" });
        }
        const teachers = await q.exec();
        res.status(200).json(teachers);
    } catch (e) {
        console.error("getTeachers error:", e);
        res.status(500).json({ message: "Server error", detail: e.message });
    }
};
// GET /api/teachers/:id
const getTeacherById = async (req, res) => {
    try {
        const { id } = req.params;
        // 1) Validate id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid teacher ID" });
        }
        // 2) Build query then conditionally populate
        let q = Teacher.findById(id);
        if (hasModel("Class")) {
            q = q.populate({ path: "classId", select: "name code room" });
        }
        if (hasModel("Subject")) {
            q = q.populate({ path: "subjectId", select: "name code" });
        }
        // 3) Execute
        const teacher = await q.exec();
        // 4) Not found
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        // 5) Success
        res.status(200).json(teacher);
    } catch (e) {
        console.error("getTeacherById error:", e);
        res.status(500).json({ message: "Server error", detail: e.message });
    }
};

// POST /api/teachers  (auto-sets Class.teacher)
const createTeacher = async (req, res) => {
    try {
        const {
            fullName, email, phone, subject,
            subjectId, classId, classCode, className,
            isActive
        } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({ message: "fullName and email are required" });
        }

        // resolve optional refs
        let classRef = null;
        try { classRef = await resolveClassRef({ classId, classCode, className }); }
        catch (e) { return res.status(404).json({ message: e.message }); }

        let subjectRef = null;
        if (subjectId) {
            if (!SubjectModel) return res.status(400).json({ message: "Subject model not available" });
            const s = await SubjectModel.findById(subjectId);
            if (!s) return res.status(404).json({ message: "subjectId not found" });
            subjectRef = s._id;
        }

        const profile = req.file?.filename || null;

        const created = await Teacher.create({
            profile, fullName, email, phone, subject,
            classId: classRef,
            subjectId: subjectRef,
            isActive: isActive !== undefined ? isActive : true,
        });

        // 🔗 set Class.teacher = this teacher
        if (classRef) {
            await ClassModel.updateOne(
                { _id: classRef },
                { $set: { teacher: created._id } }
            );
        }

        res.status(201).json(created);
    } catch (e) {
        if (e.code === 11000 && e.keyPattern?.email) {
            return res.status(409).json({ message: "Email already registered" });
        }
        console.error("createTeacher error:", e);
        res.status(400).json({ message: "Could not create teacher", detail: e.message });
    }
};

// PUT /api/teachers/:id  (moves teacher between classes)
const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await Teacher.findById(id);
        if (!existing) return res.status(404).json({ message: "Teacher not found" });

        const {
            fullName, email, phone, subject,
            subjectId, classId, classCode, className,
            isActive
        } = req.body;

        const updates = {};
        if (fullName !== undefined) updates.fullName = fullName;
        if (email !== undefined) updates.email = email;
        if (phone !== undefined) updates.phone = phone;
        if (subject !== undefined) updates.subject = subject;
        if (isActive !== undefined) updates.isActive = isActive;
        if (req.file?.filename) updates.profile = req.file.filename;

        // handle subject change
        if (subjectId !== undefined) {
            if (subjectId && !SubjectModel) {
                return res.status(400).json({ message: "Subject model not available" });
            }
            if (subjectId) {
                const s = await SubjectModel.findById(subjectId);
                if (!s) return res.status(404).json({ message: "subjectId not found" });
                updates.subjectId = s._id;
            } else {
                updates.subjectId = null;
            }
        }

        // resolve potential class change
        let newClassRef = existing.classId;
        if (classId !== undefined || classCode !== undefined || className !== undefined) {
            try { newClassRef = await resolveClassRef({ classId, classCode, className }); }
            catch (e) { return res.status(404).json({ message: e.message }); }
            updates.classId = newClassRef;
        }

        const updated = await Teacher.findByIdAndUpdate(id, updates, { new: true });

        // 🔁 if class changed: unset old class.teacher (if it pointed to this teacher) and set new class.teacher
        const oldClassRef = existing.classId?.toString() || null;
        const newClassStr = newClassRef?.toString() || null;
        const changed = (classId !== undefined || classCode !== undefined || className !== undefined)
            && oldClassRef !== newClassStr;

        if (changed) {
            if (oldClassRef) {
                await ClassModel.updateOne(
                    { _id: oldClassRef, teacher: existing._id },
                    { $unset: { teacher: "" } }
                );
            }
            if (newClassRef) {
                await ClassModel.updateOne(
                    { _id: newClassRef },
                    { $set: { teacher: updated._id } }
                );
            }
        }

        res.status(200).json(updated);
    } catch (e) {
        console.error("updateTeacher error:", e);
        res.status(400).json({ message: "Could not update teacher", detail: e.message });
    }
};

// DELETE /api/teachers/:id  (cleans up Class.teacher)
const deleteTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await Teacher.findById(id);
        if (!existing) return res.status(404).json({ message: "Teacher not found" });

        // unset Class.teacher if this teacher is assigned
        if (existing.classId) {
            await ClassModel.updateOne(
                { _id: existing.classId, teacher: existing._id },
                { $unset: { teacher: "" } }
            );
        }

        await Teacher.findByIdAndDelete(id);
        res.status(200).json({ message: "Teacher deleted" });
    } catch (e) {
        console.error("deleteTeacher error:", e);
        res.status(400).json({ message: "Could not delete teacher", detail: e.message });
    }
};

module.exports = {
    getTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
};

