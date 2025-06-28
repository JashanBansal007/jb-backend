import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
dotenv.config();

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Test function
async function testCloudinaryConnection() {
    try {
        // Test the connection by getting account details
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary connection successful!');
        console.log('📊 Account details:', result);
        
        // Test configuration
        console.log('\n🔧 Configuration:');
        console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
        console.log('API Key:', process.env.CLOUDINARY_API_KEY);
        console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***configured***' : 'NOT SET');
        
    } catch (error) {
        console.log('❌ Cloudinary connection failed:');
        console.log(error.message);
        
        if (error.message.includes('Invalid API key')) {
            console.log('\n💡 Please check your CLOUDINARY_API_KEY in .env file');
        }
        if (error.message.includes('Invalid API secret')) {
            console.log('\n💡 Please check your CLOUDINARY_API_SECRET in .env file');
        }
    }
}

// Run the test
testCloudinaryConnection();