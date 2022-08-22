const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const StudentSchema = require("./schema/studentSchema");
const TeacherSchema = require("./schema/teacherSchema");
const AdminSchema = require("./schema/adminSchema");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
// const fs = require("fs");

require("dotenv").config();
const port = 8000;
const app = express();
app.use(express.json());
app.use(cookieParser());

////////////////////////////////////////////// JWT VERIFICATION MIDDLEWARE ///////////////////////////////////////////

function verifyToken(req, res, next) {
  const token = req.cookies.token || null;
  if (token == null) return res.sendStatus(403);
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(404);
    req.user = user;
    next();
  });
}

////////////////////////////////////////////// MONGOOSE/MONGODB CONNECTION ///////////////////////////////////////////

//////// CONNECTION WITH MONGOOSE ////////
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
});

//////// MONGOOSE CONNECTION CHECKING ////////
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Database connected successfully");
});

/////////////////////////////////////////////// MULTER IMPLEMENTATION /////////////////////////////////////////////////

// MULTER UPLOADING ON "localhost:8000/image"
// KEY MUST BE "demo_image" WHEN UPLOADING
const upload = multer({ dest: "uploads/" }).single("demo_image");

//////// MULTER IMAGE POST REQUEST ////////
app.post("/image", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send("Something went wrong!");
    }
    res.send(req.file);
  });
});

////////////////////////////////////////// FETCH REQUEST HELPER FUNCTION ///////////////////////////////////////////////

// This helper function is used for searching/filtering key-value pairs in database,
// by adding a query after link http://localhost:8000/search?
// app.get("/search", async function (req, res) {
//   const fetchedData = await MySchema.find(req.query);
//   res.send(fetchedData);
// });

///////////////////////////////////// CALLBACK FUNCTION FOR SEQUENTIAL CONTROL /////////////////////////////////////////

// const textData = fs.readFileSync("input.txt");
// console.log(textData.toString());

///////////////////////////////////////////////// NODE MAILER SETUP ////////////////////////////////////////////////////

async function mailer(receiverAddress, mailSubject, mailText) {
  let sender = nodemailer.createTransport({
    host: "send.one.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  sender.sendMail({
    from: '"Adeshpreet Singh" adeshpreet.singh@hestabit.in', // sender address
    to: receiverAddress, // list of receivers
    subject: mailSubject, // Subject line
    text: mailText, // plain text body
    html: mailText, // html body
  });
}
/////////////////////////////////////////// CRUD OPERATIONS FOR STUDENTS ///////////////////////////////////////////////

//////// SIGNIN STUDENT ////////
app.post("/signin/student", async function (req, res) {
  try {
    const fetchedData = await StudentSchema.findOne({
      email: req.body.email,
      password: req.body.password,
    });
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = {
      id: fetchedData._id,
    };
    const token = jwt.sign(data, jwtSecretKey);

    if (fetchedData) {
      res.cookie("userType", "student");
      res.cookie("token", token);
      res.cookie("id", fetchedData._id);
      res.send(fetchedData.notifications);
    } else {
      res.send("Incorrect Credentials.");
    }
  } catch (error) {
    res.send("User not found");
  }
});

//////// CREATE STUDENT ////////
app.post("/signup/student", async function (req, res) {
  const newStudent = new StudentSchema({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    address: req.body.address,
    profilePicture: req.body.profilePicture,
    currentSchool: req.body.currentSchool,
    previousSchool: req.body.previousSchool,
    assignedTeacher: req.body.assignedTeacher,
    parentsDetails: {
      fathersName: req.body.parentsDetails.fathersName,
      mothersName: req.body.parentsDetails.mothersName,
    },
  });

  await AdminSchema.updateMany(
    {},
    {
      $push: {
        notifications: `A new student - ${req.body.name} has joined with Email ID - ${req.body.email} and requires approval.`,
      },
    }
  );

  newStudent.save(function (err, result) {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

//////// GET STUDENT (READ OPERATION) ////////
app.get("/student", verifyToken, async function (req, res) {
  if (req.cookies.userType === "student") {
    const fetchedData = await StudentSchema.findOne({ _id: req.cookies.id });

    if (fetchedData) {
      res.send(fetchedData);
    } else {
      res.send("Unable to retrieve data.");
    }
  } else res.send("Unable to verify user ownership, Please contact admin.");
});

//////// UPDATE STUDENT ////////
app.patch("/edit/student", verifyToken, async function (req, res) {
  if (req.cookies.userType === "student") {
    const fetchedData = await StudentSchema.findOneAndUpdate(
      { _id: req.cookies.id },
      req.body
    );
    if (fetchedData) {
      res.send("Edit Done.");
    } else {
      res.send("Server Error.");
    }
  } else if (req.cookies.userType === "admin") {
    const fetchedData = await StudentSchema.findOneAndUpdate(
      { email: req.body.email },
      req.body
    );
    if (fetchedData) {
      res.send("Edit Done.");
    } else {
      res.send("Server Error.");
    }
  } else
    res.send("Unable to edit details. Make sure you're approved by admin.");
});

//////// DELETE STUDENT (DELETE OPERATION) ////////
app.delete("/delete/student", verifyToken, async function (req, res) {
  if (req.cookies.userType === "student") {
    const fetchedData = await StudentSchema.findOneAndDelete({
      _id: req.cookies.id,
    });
    if (fetchedData) {
      res.send("Student Deleted.");
    } else {
      res.send("Server error, Please try again later.");
    }
  } else res.send("You are not authorized to delete this user.");
});

////////////////////////////////////////// CRUD OPERATIONS FOR TEACHERS ////////////////////////////////////////////////

//////// SIGNIN TEACHER ////////
app.post("/signin/teacher", async function (req, res) {
  try {
    const fetchedData = await TeacherSchema.findOne({
      email: req.body.email,
      password: req.body.password,
    });
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = {
      id: fetchedData._id,
    };
    const token = jwt.sign(data, jwtSecretKey);
    if (fetchedData) {
      res.cookie("id", fetchedData._id);
      res.cookie("token", token);
      if (fetchedData.isTeacher === true) {
        res.cookie("userType", "teacher");
      }
      res.send(fetchedData.notifications);
    } else {
      res.send("Incorrect Credentials.");
    }
  } catch (error) {
    res.send("User not found.");
  }
});

//////// CREATE TEACHER (CREATE OPERATION) ////////
app.post("/signup/teacher", async function (req, res) {
  const newTeacher = new TeacherSchema({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    address: req.body.address,
    profilePicture: req.body.profilePicture,
    currentSchool: req.body.currentSchool,
    previousSchool: req.body.previousSchool,
    experience: req.body.experience,
    expertiseInSubjects: req.body.expertiseInSubjects,
  });

  await AdminSchema.updateMany(
    {},
    {
      $push: {
        notifications: `A new teacher - ${req.body.name} has joined with Email ID - ${req.body.email} and requires approval.`,
      },
    }
  );

  newTeacher.save(function (err, result) {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

//////// GET TEACHER (READ OPERATION) ////////
app.get("/teacher", verifyToken, async function (req, res) {
  if (req.cookies.userType === "teacher") {
    const fetchedData = await TeacherSchema.findOne({ _id: req.cookies.id });

    if (fetchedData) {
      res.send(fetchedData);
    } else {
      res.send("Unable to retrieve data.");
    }
  } else res.send("Unable to verify user ownership, Please contact admin.");
});

//////// EDIT TEACHER (UPDATE OPERATION) ////////
app.patch("/edit/teacher", verifyToken, async function (req, res) {
  if (req.cookies.userType === "teacher") {
    const fetchedData = await TeacherSchema.findOneAndUpdate(
      { _id: req.cookies.id },
      req.body
    );

    if (fetchedData) {
      res.send(fetchedData);
    } else {
      res.send("Unable to retrieve data.");
    }
  } else res.send("Unable to verify user ownership, Please contact admin.");
});

//////// DELETE TEACHER (DELETE OPERATION) ////////
app.delete("/delete/teacher", verifyToken, async function (req, res) {
  if (req.cookies.userType === "teacher" || "admin") {
    const fetchedData = await TeacherSchema.findOneAndDelete({
      _id: req.cookies.id,
    });
    if (fetchedData) {
      res.send("Teacher Deleted.");
    } else {
      res.send("Server error, Please try again later.");
    }
  } else res.send("You are not authorized to delete this user.");
});

//////////////////////////////////////////////// ADMINS OPERATIONS //////////////////////////////////////////////////////

//////// ADMIN SIGNIN ////////
app.post("/signin/admin", async function (req, res) {
  const fetchedData = await AdminSchema.findOne({
    email: req.body.email,
    password: req.body.password,
  });
  if (fetchedData) {
    res.cookie("userType", "admin");
    res.send(fetchedData.notifications);
  } else {
    res.send("Incorrect Credentials");
  }
});

//////// APPROVE STUDENT ////////
app.patch("/approve/student", async function (req, res) {
  if (req.cookies.userType === "admin") {
    const fetchedData = await StudentSchema.findOneAndUpdate(
      { email: req.body.email },
      {
        isApproved: true,
        $push: { notifications: "Admin has approved your join request." },
      }
    );

    const mailSubject = "Join request approval status";
    const mailText = "Admin has approved your join request.";

    if (fetchedData) {
      mailer(fetchedData.email, mailSubject, mailText);
      await AdminSchema.updateMany(
        {},
        {
          $push: {
            notifications: `Student with Email ID - ${req.body.email} has been approved.`,
          },
        }
      );
      res.send("Student Approved.");
    } else {
      res.send("Student not found.");
    }
  } else res.send("You're not authorized to approve students.");
});

//////// APPROVE TEACHER ////////
app.patch("/approve/teacher", async function (req, res) {
  if (req.cookies.userType === "admin") {
    const fetchedData = await TeacherSchema.findOneAndUpdate(
      { email: req.body.email },
      {
        isApproved: true,
        isTeacher: true,
        $push: { notifications: "Admin has approved your join request." },
      }
    );

    const mailSubject = "Join request approval status";
    const mailText = "Admin has approved your join request.";

    if (fetchedData) {
      mailer(fetchedData.email, mailSubject, mailText);
      await AdminSchema.updateMany(
        {},
        {
          $push: {
            notifications: `Teacher with Email ID - ${req.body.email} has been approved.`,
          },
        }
      );
      res.send("Teacher Approved.");
    } else {
      res.send("Teacher not found.");
    }
  } else res.send("You're not authorized to approve teachers.");
});

//////// ASSIGN TEACHER ////////
app.patch("/assignteacher", async function (req, res) {
  if (req.cookies.userType === "admin") {
    const fetchedData = await StudentSchema.findOneAndUpdate(
      {
        email: req.body.email,
      },
      {
        assignedTeacher: req.body.assignedTeacher,
        $push: {
          notifications: `Teacher with Email ID - ${req.body.assignedTeacher} has been assigned to you.`,
        },
      }
    );

    await TeacherSchema.findOneAndUpdate(
      { email: req.body.assignedTeacher },
      {
        $push: {
          notifications: `Student with Email ID - ${req.body.email} has been assigned to you.`,
        },
      }
    );

    if (fetchedData) {
      res.send("Teacher Assigned.");
    } else {
      res.send("Student not found.");
    }
  } else res.send("You're not authorized to assign teachers.");
});

//////// DAILY MAIL SCHEDULER SETUP ////////

const dailyMail = async () => {
  const unapprovedStudents = await StudentSchema.find({ isApproved: false });
  const unapprovedTeachers = await TeacherSchema.find({ isApproved: false });

  const teachers = unapprovedTeachers.map(
    (user) =>
      `Name: ${user.name} | Email: ${user.email} | Needs approval for role: Teacher`
  );
  const students = unapprovedStudents.map(
    (user) =>
      `Name: ${user.name} | Email: ${user.email} | Needs approval for role: Student`
  );
  const final = await teachers.concat(students);
  await mailer(
    "adeshpreet.singh@hestabit.in",
    "Reminder - Users need approval",
    final.toString()
  );
};

const task = cron.schedule("0 0 * * *", () => {
  dailyMail();
});

task.start();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////// BASIC HOME PAGE GET REQUEST ////////
// app.get("/", (req, res) => {
//   res.send();
// });

//////// SERVER INFORMATION ////////
app.listen(port, () => {
  console.log("Server is running on http://localhost:" + port);
});
