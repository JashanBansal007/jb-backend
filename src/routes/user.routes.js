import { Router } from "express";
import { registerUser, getAllUsers, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

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


export default router;