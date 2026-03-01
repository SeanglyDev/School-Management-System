const mongoose = require('mongoose');
const subjectSchema = new mongoose.Schema({
    name: {type: String, required: true,trim:true},
    code: {type: String, required: true, unique:true, uppercase:true, trim:true},
    description: {type: String, required: true ,trim:true},
},{timestamps: true});
subjectSchema.index({ name: "text", code: "text", description: "text" });
module.exports = mongoose.model("subject", subjectSchema);