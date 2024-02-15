import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB coonected !! \n DB Host :${connectionInstance.connection.host}`);
        console.log(`\n connection :${connectionInstance}`);// important
        
    } catch (error) {
        console.log("MongoDB connection error:",error);
        process.exit(1);
    }
}
export default connectDB;