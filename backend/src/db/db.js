import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log("DB successfully connected");
}

export default main;