import { asyncHandler } from "../utils/asynHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
            $unset:
            {
                refreshToken: 1 //this removes feild from document
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

    if(!incomingRefreshToken)
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

const changeCurrentPassword = asyncHandler(async(req,res) =>{
    const {oldPassword , newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user
    .isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect)
    {
        throw new apiError(400 , "invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse (200 , {} , "password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse (200 , req.user , "Current user fetched Successfully"))
})


const updateAccountDetails = asyncHandler(async(req,res) =>{
    const { fullName , email ,} = req.body

    if(!fullName || !email) {
        throw new apiError(400, "Full Name and Email are required")
    }

    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            }
        },
        {new : true},

    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "account details updated successfully"))
}) 

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required")
    }
    // delete the previous avatar file if it exists
    // if (req.user.avatar) {
    //     const previousAvatarPath = req.user.avatar.split('/').pop();
    //     const previousAvatarLocalPath = `./uploads/${previousAvatarPath}`;
    //     if (fs.existsSync(previousAvatarLocalPath)) {
    //         fs.unlinkSync(previousAvatarLocalPath);
    //     }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new apiError(400, "Avatar file upload failed")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                avatar: avatar.url
            }
        },
        {new: true},
    ).select("-password")

    return res
    .status(200)
    .json(200 , user , "Avatar Updated Successfully")
    
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new apiError(400, "coverImage file is required")
    }

    const coverimage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverimage.url) {
        throw new apiError(400, "coverImage file upload failed")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                coverimage: coverimage.url
            }
        },
        {new: true},
    ).select("-password")

    return res
    .status(200)
    .json(200 , user , "Cover Image Updated Successfully")
})

const getUserChannelProfile = asyncHandler(async(req,res) =>{
    const {username} = req.params

    if(!username.trim())
    {
        throw new apiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed to"
            }
        },
        {
            $addFields:{
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$sunscribed to"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id,"$subscribers.subscriber"],
                            then: true,
                            else: false
                        }
                    }
                }
            }
        },
        {
            $project: {
                fullName : 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                avatar: 1,
                coverImage: 1,
                email: 1



            }
        }

    ])

    if(!channel?.length){
        throw new apiError(404, "Channel doesnot exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async(req,res) =>{
    const user = await useTransition.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
        $lookup: {
            from: "vedios",
            localField : "watchHistory",
            foreignField : "_id",
            as: "watchHistory",
            pipeline : [
                {
                    $lookup : {
                        from : "users",
                        localField: "owner",
                        foreignField : "_id",
                        as : "owner",
                        pipeline : [
                            {
                                $project: {
                                    fullName : 1,
                                    username : 1,
                                    avatar : 1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields : {
                        owner : {
                            $first : "$owner"
                        }
                    }
                }
            ]
        }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200 , user[0].watchHistory,
        "watch history fetched successfully"))
})


export {registerUser,
     getAllUsers ,
      loginUser,
      logoutUser,
      refreshAccessToken,
      changeCurrentPassword,
      getCurrentUser,
      updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory}