import { type } from "express/lib/response";
import mongoose , {Schema} from "mongoose";

const playlistSchema = new Schema(
    {
        name : {
            type: String,
            required: true,
        },
        discription : {
            type: String,
            required: true,
        },
        vedios : [{
            type : Schema.Types.ObjectId, //array of video ids
            ref : "Video" //ref to video model
        }],
        owner : {
            type : Schema.Types.ObjectId, //owner of the playlist
            ref : "User", //ref to user model 
        }
    },{timestamps:true})