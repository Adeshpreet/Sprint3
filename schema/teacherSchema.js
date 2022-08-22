const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
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
    required: false,
  },
  previousSchool: {
    type: String,
    required: false,
  },
  experience: {
    type: String,
    required: true,
  },
  expertiseInSubjects: [String],
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

const TeacherSchema = mongoose.model("TeacherSchema", teacherSchema);
module.exports = TeacherSchema;
