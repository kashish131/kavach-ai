import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    // console.log("db connected");
    console.log("Connected to DB:", mongoose.connection.name);
  } catch (error) {
    console.error("db connection error:", error.message);
  }
};

export default connectDb;