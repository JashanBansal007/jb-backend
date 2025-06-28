import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Ensure the environment variable is set correctly
if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable is not set.");
    process.exit(1);
}

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: DB_NAME,
        });
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB;