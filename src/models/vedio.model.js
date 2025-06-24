import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; 
const vedioSchema = new Schema (
    {
        vediofile : {
            type: String,
            required : true
        },
        thumbnail : {
            type: String,
            required : true
        },
        title : {
            type: String,
            required : true
        },
        description : {
            type: String,
            required : true
        },
        duration : {
            type: Number,
            required : true
        },
        views : {
            type: Number,
            default : 0
        },
        ispublished : {
            type: Boolean,
            default : false
        },
        owner : {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

    })


    vedioSchema.plugin(mongooseAggregatePaginate)
    export const Vedio = mongoose.model("Vedio" , vedioSchema) 