import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'


const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}
    } 
    catch (error) {
        throw new ApiError(500,"Something went wrong while generating Access and Refresh Token")
        
    }
}

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

    if (
        [fullName,email,username,password].some((field)=>{
            field?.trim()==""
        })
        ) {
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await  User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409,"Username or email already exists")
    }

    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {

        throw new ApiError(400, "Avatar file is required, Please add an avatar to continue")
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

const loginUser = asyncHandler( async (req,res) => {
    //get data from req.body
    // check for username or email (username or email based login)
    //find the user
    //password check
    //access and refresh token
    //send them in cookies
    //send response
    const {email,username,password} = req.body

    if(!username && !email){
        throw new ApiError(404,"username or email is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken} = await generateAccessandRefreshToken(user._id)

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedinUser,accessToken,refreshToken
            },
            "user loggedin Successfully"
        )
    )

} )

//dekho samasya toh ye hai ki login and register mei toh req.body se user le lete hai but log out k wqt user ko form thodi denge.....so no req.body
// toh hum krenge ye ki ek middleware design kar denge verifyJWT usse kya hoga ki during routing login user ka access req.user mei chala jyga ab use wo har koi access kar lega jo v middleware ke bad route krega
const logoutUser = asyncHandler(async (req,res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"user logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401,"Refresh token expired")
        }  
        
        const {accessToken,newRefreshToken} = await generateAccessandRefreshToken(user._id)
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message||"Unable to refresh access token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password changed Successfully"
        )
    )

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {username,email} = req.body

    if (!username || !email) {
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing")
    }
        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if (!avatar.url) { //cloudinary sends "" if any issue occurs while uploading any file on cloudinary
            throw new ApiError(400,"Error while uploading avatar file")
        }

        const user = await User.findByIdAndUpdate
        (
            req.user._id,
            {
                $set:{
                    avatar:avatar.url
                }
            },
            {
                new: true
            }
        
        ).select("-password")

        return res
        .status(
            200,
            new ApiResponse(
                200,
                user,
                "Avatar image updated successfully"
            )
        )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const CoverImageLocalPath = req.file?.path

    if (!CoverImageLocalPath) {
        throw new ApiError(400,"Cover image file is missing")
    }
        const CoverImage = await uploadOnCloudinary(CoverImageLocalPath)

        if (!CoverImage.url) { //cloudinary sends "" if any issue occurs while uploading any file on cloudinary
            throw new ApiError(400,"Error while uploading Cover image file")
        }

        const user = await User.findByIdAndUpdate
        (
            req.user._id,
            {
                $set:{
                    CoverImage:CoverImage.url
                }
            },
            {
                new: true
            }
        
        ).select("-password")

        return res
        .status(
            200,
            new ApiResponse(
                200,
                user,
                "Cover image updated successfully"
            )
        )
})

export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,
        updateAccountDetails,updateUserAvatar,updateUserCoverImage}