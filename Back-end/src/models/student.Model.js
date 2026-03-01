const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    profile:     { type: String, default: null },                       // not required
    name:        { type: String, required: true, trim: true },
    age:         { type: Number, required: true, min: 3 },
    gender:      { type: String, required: true, enum: ["male","female","other"] },
    classId:     { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
    email:       { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },                        // use Date + better name
    isActive:    { type: Boolean, default: true }
}, { timestamps: true /* , collection: 'Student' */ });               // consider removing custom collection

module.exports = mongoose.model("Student", studentSchema);

