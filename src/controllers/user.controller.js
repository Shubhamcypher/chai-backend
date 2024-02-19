import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation check -  if empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName,username,email,password}=req.body
    console.log("email",email);

    if (
        [fullName,email,username,password].some((field)=>{
            field?.trim()==""
        })
        ) {
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409,"Username or email already exists")
    }

    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is mandatory, Please provide an avatar to continue")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is mandatory, Please provide an avatar to continue")
    }

    const user= await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url||"",
        email,
        password,
        username: username.toLowerCase()

    })

    const createdUser = await User.findById(user).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(200).json(
        new ApiResponse(200,createdUser,"User registration successful")
    )
})

export {registerUser}