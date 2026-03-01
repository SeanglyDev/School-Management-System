const mongoose = require("mongoose");
const scheduleSchema = new mongoose.Schema(
    {
        dayOfWeek: { type: String, enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], required: true },
        startTime: { type: String, required: true },
        endTime:   { type: String, required: true },
    },
    { _id: false }
);

const classSchema = new mongoose.Schema(
    {
        // Use "name" for the class name (simpler). If you must keep "fullName", see the alternate version below.
        name:        { type: String, required: true, trim: true },
        code:        { type: String, required: true, unique: true, lowercase: true, trim: true },
        description: { type: String, required: true, trim: true },
        room:        { type: String, required: true, trim: true },
        schedule:    scheduleSchema,

        // relations
        teacher:  { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", default: null },
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    },
    { timestamps: true }
);

// helpful text index
classSchema.index({ name: "text", code: "text", description: "text", room: "text" });

// IMPORTANT: correct export + model name
module.exports = mongoose.model("Class", classSchema);
