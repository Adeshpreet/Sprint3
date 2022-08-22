const mongoose = require("mongoose");

const mySchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
});

const MySchema = mongoose.model("MySchema", mySchema);
module.exports = MySchema;
