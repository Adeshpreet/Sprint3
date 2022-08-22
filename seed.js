//////////////////////////////////////////////////// SEEDER //////////////////////////////////////////////////////////////

// const seedingDatabase = require("./databases/seedingDatabase");
// const MySchema = require("./schema/mySchema");
const adminDatabase = require("./databases/adminDatabase");
const AdminSchema = require("./schema/adminSchema");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
});

const dbSeeder = async () => {
  // MySchema will is made only for seeder example
  // await MySchema.deleteMany({});
  // await MySchema.insertMany(seedingDatabase);

  await AdminSchema.deleteMany({});
  await AdminSchema.insertMany(adminDatabase);
};

dbSeeder().then(() => {
  mongoose.connection.close();
});
