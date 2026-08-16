const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user.model");

const adminEmail = (process.env.ADMIN_EMAIL || "admin@complexell.dev").toLowerCase();
const adminUsername = process.env.ADMIN_USERNAME || "complexell_admin";
const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123!";

const bootstrapAdmin = async () => {
  try {
    if (!process.env.DB_URI) {
      throw new Error("DB_URI is missing in Backend/.env");
    }

    await mongoose.connect(process.env.DB_URI);

    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      existingUser.role = "admin";
      existingUser.username = adminUsername;
      existingUser.password = await bcrypt.hash(adminPassword, 10);
      existingUser.isVerified = true;
      await existingUser.save();

      console.log("Admin account updated successfully.");
      console.log(`Email: ${adminEmail}`);
      console.log(`Username: ${adminUsername}`);
      console.log(`Password: ${adminPassword}`);
      return;
    }

    const newAdmin = await User.create({
      username: adminUsername,
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      isVerified: true,
      role: "admin",
    });

    console.log("Admin account created successfully.");
    console.log(`Email: ${newAdmin.email}`);
    console.log(`Username: ${newAdmin.username}`);
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    console.error("Admin bootstrap failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

bootstrapAdmin();
