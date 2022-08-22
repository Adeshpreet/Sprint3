const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    required: true,
  },
  currentSchool: {
    type: String,
    required: true,
  },
  previousSchool: {
    type: String,
    required: true,
  },
  parentsDetails: {
    fathersName: { type: String, required: true },
    mothersName: { type: String, required: true },
  },
  assignedTeacher: {
    type: String,
    match: /.+\@.+\..+/,
    required: true,
    default: "none@none.com",
  },
  isApproved: {
    type: Boolean,
    required: true,
    default: false,
  },
  isTeacher: {
    type: Boolean,
    required: true,
    default: false,
  },
  notifications: [String],
});

const StudentSchema = mongoose.model("StudentSchema", studentSchema);
module.exports = StudentSchema;
