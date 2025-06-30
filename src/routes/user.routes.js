import { Router } from "express";
import { registerUser,
     getAllUsers,
      loginUser,
       logoutUser,
        refreshAccessToken,
         changeCurrentPassword,
          getCurrentUser,
           updateAccountDetails,
            updateUserAvatar,
             updateUserCoverImage,
              getUserChannelProfile,
               getWatchHistory }
                from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verify } from "jsonwebtoken";

const router = Router();

// Print expected fields during server startup
const expectedFields = ['avatar', 'coverimage'];
console.log("Multer is configured to accept these fields:", expectedFields);

router.route("/register").post(
    upload.fields([
        {name: 'avatar', maxCount: 1},
        {name: 'coverimage', maxCount: 1}  // Lowercase to match form-data
    ]),
    registerUser);

// Add route to get all users (for debugging)
router.route("/all").get(getAllUsers);

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT , logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("current-user").post(verifyJWT, getCurrentUser)
router.route("/update-details").patch(verifyJWT , updateAccountDetails)
router.route("/avatar").patch(verifyJWT , upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT , upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT , getUserChannelProfile)
router.route("/history").get(verifyJWT , getWatchHistory)

export default router;