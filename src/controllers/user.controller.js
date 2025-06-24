import { asyncHandler } from "../utils/asynHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    const {fullName,email,usename,password} =  req.body
    console.log("email : ", email);

    // if(fullName === ""){
    //     throw new apiError(400, "Full Name is required")
    // }

    if (
        [fullName,email,usename,password].some((feild) => {
            feild?.trim() === ""
        })
    ) {
        throw new apiError(400, "All feilds are required")
    }

    const ExistedUser = User.findOne({
        $or : [{email} , {username}]

    })

    if (ExistedUser) {
        throw new apiError(409, "User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverimageLocalPath = req.files?.coverimage[0]?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverimageLocalPath)

    if (!avatar) {
        throw new apiError(400, "Avatar file is required")
    }

    const user = await User.create ({
        fullname,
        avatar : avatar.url,
        coverimage : coverimage?.url || "",
        email,
        password,
        username : username.toLowerCase()

        
    })

    const createdUser = await User.findById(user._id).select("-password -refreshtoken") 

    if(!createdUser) {
        throw new apiError(500, "User not created")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered successfully")
    )



})


export {registerUser}