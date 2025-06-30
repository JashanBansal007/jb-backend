import mongoose , {Schema} from "mongoose";

const likeSchema = new Schema(
    {
        vedio : {
            type : Schema.Types.ObjectId,
            ref : "Video",
            required : true
        },
        Comment : {
            type : Schema.Types.ObjectId,
            ref : "Comment",
            required : true
        },
        twwet : {
            type : Schema.Types.ObjectId,
            ref : "Tweet",
            required : true
        },
        likedBy : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : true
        },
    },
    {
        timestamps : true
    })

    export const Like = mongoose.model("Like" , likeSchema)