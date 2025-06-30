import { type } from "express/lib/response";
import mongoose , {Schema} from "mongoose";

const tweetSchema = new Schema({
    content : {
        type: String,
        required: true,
    },
    owner : {
        type : Schema.Types.ObjectId, //owner of the tweet
        ref : "User", //ref to user model
    }
},{timestamps:true})


export const Tweet = mongoose.model("Tweet", tweetSchema);  