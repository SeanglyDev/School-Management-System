const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploadStudents", express.static(path.join(__dirname, "uploadStudents")));
app.use("/uploadTeacher", express.static(path.join(__dirname, "uploadTeacher")));

// Routes
const studentRoutes = require("./routes/studentRoute");
const userRoutes = require("./routes/userRoute");
const classRoutes = require("./routes/classRoute");
const teacherRoutes = require("./routes/teacherRoute");
const subjectRoutes = require("./routes/subjectRoute");


app.use("/api/students", studentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/class",classRoutes);
app.use("/api/teachers",teacherRoutes);
app.use("/api/subject",subjectRoutes);

app.get("/", (req, res) => {
    res.send("Hello Welcome to my API");
});

// MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ DB Error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port http://localhost:${PORT}`));
