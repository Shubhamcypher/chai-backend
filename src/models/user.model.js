import mongoose from "mongoose";
import { Jwt } from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    watchHistory:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
    FullName:{
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    avatar:{
        type: String, //cloudinary URL
        required:true
    },
    coverImage:{
        type: String, //cloudinary URL
    },
    password:{
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken:{
        type: String
    }

},{timestamps:true})

userSchema.pre("save", async function(next){
    if(bcrypt.isModified("password")){
        this.password = await bcrypt.hash(this.password,10)
        next()
    }
    next()
})

export const User = mongoose.model("User",userSchema)