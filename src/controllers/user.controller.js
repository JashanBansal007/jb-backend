import { asyncHandler } from "../utils/asynHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: true });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new apiError(500, "something went wrong while generating access and refresh token");
    }
}

const registerUser = asyncHandler( async (req , res) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exists : username, email
    //check for images - check for avatar
    // upload them to cloudinary , avatar
    //create user object - create entry in db
    // remove password and referesh token from response
    //check for user creation
    //resturn response
    const {fullName,email,username,password} =  req.body
    console.log("email : ", email);
    console.log("fullName : ", fullName);
    console.log("username : ", username);
    console.log("password : ", password);
    console.log("Request body:", req.body);

    // if(fullName === ""){
    //     throw new apiError(400, "Full Name is required")
    // }

    if (        [fullName,email,username,password].some((field) => {
            field?.trim() === ""
        })
    ) {
        throw new apiError(400, "All fields are required")
    }
    
    const ExistedUser = await User.findOne({
        $or : [{email} , {username}]
    })

    if (ExistedUser) {
        throw new apiError(409, "User already exists")
    }    // Debug: Check what files are being received
    console.log("req.files:", req.files);
    console.log("req.body:", req.body);
    console.log("Form fields:", Object.keys(req.body));
    if (req.files) {
        console.log("File fields:", Object.keys(req.files));
    }
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //const coverImageLocalPath = req.files?.coverimage?.[0]?.path;  // Changed to lowercase to match your form

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverImageLocalPath)

    console.log("Avatar upload result:", avatar);
    console.log("Coverimage upload result:", coverimage);
    console.log("Coverimage URL:", coverimage?.url);

    if (!avatar) {
        throw new apiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullname: fullName,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",  // Changed to lowercase to match model
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshtoken") 

    if(!createdUser) {
        throw new apiError(500, "User not created")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered successfully")
    )



})

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("-password -refreshtoken");
    return res.status(200).json(
        new ApiResponse(200, users, "Users retrieved successfully")
    )
});

const loginUser = asyncHandler(async (req,res) => {
    //req body se data le aoo
    //username or email se user ko dhoondo
    //password check kro
    //access and refresh token
    //send cookie

    const {email , username , password} = req.body
    if (!(username || email)){
        throw new apiError(400 , "Username or Email is required")
    }
    const user = await User.findOne({
        $or: [{username} , {email}]
    })

    if(!user) {
        throw new apiError(404 , "User not found")
    }

    await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new apiError(401 , "Password incorrect")
    }
    const {accessToken , refreshToken} = await 
    generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshtoken")



    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken" , accessToken,options)
    .cookie("refreshToken" , refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser,
                accessToken,
                refreshToken
            }
        )
    )
    
}) 

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:
            {
                refreshToken: undefined
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

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200 , {} , "User logged out successfully"))


})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || 
    req.body.refreshToken

    if(!refreshAccessToken)
    {
        throw new apiError(401,"Unauthorised request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new apiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user.refreshToken) {
            throw new apiError(401, "refreshtoken is expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken , newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200
                ,{
                    accessToken,
                    refreshToken: newRefreshToken,
                    
                },
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new apiError(401, error?.message || 
          "Invalid refresh token"
        )
    }
})

export {registerUser, getAllUsers , loginUser,logoutUser,refreshAccessToken}