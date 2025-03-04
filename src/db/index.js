import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`/n MONGODB connected !!! DB  Host: ${connectionInstance.connection.host}`);
    }
    catch(error){
        console.error("Error: ", error);
        process.exit(1);
    }
}

export default connectDB;

/*
import express from 'express';
const app = express();

( async () => {
    try {
        await  mongoose.connect('${process.env.MONGODB_URI}/${DB_NAME}' )
        app.on("error" , (Err) => {
            console.log("Error connecting to the database");
            throw Err
            app.listen(process.env.PORT, () => {
                console.log('app is listening on: ${process.env.PORT}');
            })
            
        })
    }
    catch (error) {
        console.error("Error: ", error)
        throw err
    }
} )()

*/




