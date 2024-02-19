import mongoose from "mongoose";
import  pkg  from "jsonwebtoken";
import bcrypt from "bcrypt";

const { jwt } = pkg;

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
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            _id: this.id,
            username: this.username,
            email: this.email,
            fullName: this.FullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
        
    )
}

userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {
            _id: this.id
        },
        process.env.ACCESS_TOKEN_SECRET,
        
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
)}


export const User = mongoose.model("User",userSchema)