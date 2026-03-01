// src/routes/studentRoute.js
const express = require('express');
const router = express.Router();
const { createStudent, getStudent, getStudentById, updateStudent, deleteStudent } = require("../controller/studentController");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Resolve to: <project-root>/src/uploads
const uploadDir = path.resolve(__dirname, "..", "uploadStudents");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
        cb(null, `${Date.now()}-${base}${ext}`);
    }
});

const upload = multer({ storage });

router.get('/', getStudent);
router.get('/:id', getStudentById);
router.post('/', upload.single("profile"), createStudent);
router.put('/:id', upload.single("profile"), updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
