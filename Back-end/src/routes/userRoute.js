const express = require("express");
const router = express.Router();
const multer = require("multer");
const { createUser, loginUser, getUsers, getUserById, updateUser, deleteUser } = require("../controller/userController");
const fs = require("fs");
const path = require("path");

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });

// Routes
router.post("/login", loginUser);
router.post("/", upload.single("profile"), createUser);
router.post("/register", upload.single("profile"), createUser);
router.put("/:id", upload.single("profile"), updateUser);
router.delete("/:id", deleteUser);
router.get("/:id", getUserById);
router.get("/", getUsers);

module.exports = router;


