const Student = require('../models/student.Model');
const mongoose = require('mongoose');
const ClassModel = require('../models/classModel');

async function resolveClassRef({ classId, className, classCode }) {
    if (classId) {
        if (!mongoose.isValidObjectId(classId)) throw new Error("Invalid classId");
        const c = await ClassModel.findById(classId);
        if (!c) throw new Error("classId not found");
        return c._id;
    }
    if (className) {
        const c = await ClassModel.findOne({ name: className });
        if (!c) throw new Error(`Class "${className}" not found`);
        return c._id;
    }
    if (classCode) {
        const c = await ClassModel.findOne({ code: classCode });
        if (!c) throw new Error(`Class code "${classCode}" not found`);
        return c._id;
    }
    return null;
}
const createStudent = async (req, res) => {
    try {
        const {
            name, age, gender, phoneNumber, email,
            dateOfBirth, dob, DayOfBirth,   // accept any; we’ll normalize
            classId                          // <- the class’ ObjectId string
        } = req.body;

        // profile from multer or plain string
        const profile = req.file?.filename || req.body.profile || null;

        // required checks (match your model)
        for (const [k, v] of Object.entries({ name, age, gender, phoneNumber })) {
            if (v === undefined || v === null || v === "") {
                return res.status(400).json({ message: `${k} is required` });
            }
        }

        // normalize DoB -> dateOfBirth (your model uses dateOfBirth)
        const dobRaw = dateOfBirth || dob || DayOfBirth;
        if (!dobRaw) return res.status(400).json({ message: "dateOfBirth is required" });
        const dobDate = new Date(dobRaw);
        if (isNaN(dobDate.getTime())) {
            return res.status(400).json({ message: "dateOfBirth must be a valid date (e.g. 2012-06-01)" });
        }

        // (optional) validate classId exists
        let classRef = null;
        if (classId) {
            if (!mongoose.isValidObjectId(classId)) {
                return res.status(400).json({ message: "Invalid classId" });
            }
            const klass = await ClassModel.findById(classId);
            if (!klass) return res.status(404).json({ message: "classId not found" });
            classRef = klass._id;
        }

        // 1) create student
        const created = await Student.create({
            profile, name, age, gender, phoneNumber, email,
            dateOfBirth: dobDate,
            classId: classRef,
            isActive: true,
        });

        // 2) add to class.students
        if (classRef) {
            await ClassModel.updateOne(
                { _id: classRef },
                { $addToSet: { students: created._id } }
            );
        }

        // optional: populate class info in response
        const out = classRef
            ? await created.populate({ path: "classId", select: "name code room" })
            : created;

        res.status(201).json(out);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(409).json({ message: "Email already exists" });
        }
        console.error("createStudent error:", error);
        res.status(400).json({ message: "Could not create student", detail: error.message });
    }
};
const getStudent = async (req, res) => {
    try {
        const students = await Student.find()
            .populate('classId','name')
            .lean();
        res.status(200).json(students)
    } catch (error) {
        console.error('getStudents error:', error);
        res.status(500).json({ message: err.message });
    }
};
const getStudentById = async (req, res) => {
    try {
        const {id} = req.params;
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({message: "Student not found"});
        }
        res.status(200).json(student);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
}
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await Student.findById(id);
        if (!existing) return res.status(404).json({ message: "Student not found" });

        const {
            name, age, gender, phoneNumber, email,
            dateOfBirth, dob, DayOfBirth,
            classId    // new class id (optional)
        } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (age !== undefined) updates.age = age;
        if (gender !== undefined) updates.gender = gender;
        if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;
        if (email !== undefined) updates.email = email;

        // profile via multer
        if (req.file?.filename) updates.profile = req.file.filename;

        // normalize DoB if provided
        const dobRaw = dateOfBirth || dob || DayOfBirth;
        if (dobRaw !== undefined) {
            const d = new Date(dobRaw);
            if (isNaN(d.getTime())) return res.status(400).json({ message: "dateOfBirth invalid" });
            updates.dateOfBirth = d;
        }

        // handle class change
        let newClassRef = existing.classId; // default: unchanged
        if (classId !== undefined) {
            if (classId) {
                if (!mongoose.isValidObjectId(classId)) {
                    return res.status(400).json({ message: "Invalid classId" });
                }
                const klass = await ClassModel.findById(classId);
                if (!klass) return res.status(404).json({ message: "classId not found" });
                newClassRef = klass._id;
                updates.classId = newClassRef;
            } else {
                // allow clearing class
                updates.classId = null;
                newClassRef = null;
            }
        }

        const updated = await Student.findByIdAndUpdate(id, updates, { new: true });

        // sync class.students if class changed
        const oldClassRef = existing.classId?.toString() || null;
        const changed = (classId !== undefined) && ((newClassRef?.toString() || null) !== oldClassRef);

        if (changed) {
            if (oldClassRef) {
                await ClassModel.updateOne({ _id: oldClassRef }, { $pull: { students: updated._id } });
            }
            if (newClassRef) {
                await ClassModel.updateOne({ _id: newClassRef }, { $addToSet: { students: updated._id } });
            }
        }

        res.status(200).json(updated);
    } catch (error) {
        console.error("updateStudent error:", error);
        res.status(400).json({ message: "Could not update student", detail: error.message });
    }
};

// --- Delete student; pull from class.students ---
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await Student.findById(id);
        if (!existing) return res.status(404).json({ message: "Student not found" });

        if (existing.classId) {
            await ClassModel.updateOne(
                { _id: existing.classId },
                { $pull: { students: existing._id } }
            );
        }

        await Student.findByIdAndDelete(id);
        res.status(200).json({ message: "Student deleted" });
    } catch (error) {
        console.error("deleteStudent error:", error);
        res.status(400).json({ message: "Could not delete student", detail: error.message });
    }
};


module.exports = {
    createStudent,
    getStudent,
    getStudentById,
    updateStudent,
    deleteStudent,
}