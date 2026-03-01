// src/routes/teacherRoute.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const {
    getTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
} = require("../controller/teacherController");

// ---- Multer setup (stores files in /src/uploads) ----
const uploadDir = path.join(__dirname, "../uploadTeacher");
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || "");
        cb(null, `teacher-${unique}${ext}`);
    },
});
const upload = multer({ storage });

// ---- Routes ----
// /api/teachers
router.get("/", getTeachers);
router.get("/:id", getTeacherById);

// Create with profile image (field name: "profile")
router.post("/", upload.single("profile"), createTeacher);

// Update with optional new profile image
router.put("/:id", upload.single("profile"), updateTeacher);

router.delete("/:id", deleteTeacher);

module.exports = router;
