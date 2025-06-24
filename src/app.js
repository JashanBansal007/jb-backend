import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express(); // Initialize app first

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        _credentials: true, 
        get credentials() {
            return this._credentials;
        },
        set credentials(value) {
            this._credentials = value;
        },
    }
));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));

app.use(express.static("public"));

//routes import
import userRoutes from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/users", userRoutes); // Fixed missing slash in the route

// Example endpoint: http://localhost:8000/api/v1/users/register

export { app };
