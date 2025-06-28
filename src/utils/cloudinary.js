import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // Upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        // File has been uploaded successfully
        //console.log("File uploaded successfully", response.url);
        fs.unlinkSync(localFilePath); // Delete the temporary file from local storage
        // Delete the temporary file from local storage
        fs.unlinkSync(localFilePath);
        
        return response;
    } catch (error) {
        // Delete the temporary file from local storage even if upload failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.log("Error while uploading file on cloudinary", error);
        return null;
    }
}

export {uploadOnCloudinary}