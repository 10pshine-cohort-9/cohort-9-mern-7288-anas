import mongoose , {Schema}from 'mongoose'

const noteSchema = new Schema({
    title: {
        type: String,
        required: [true , "Title is required"],
        trim: true,
        index: true
    },
    content: {
        type: String,
        default: ""
    },
    owner : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    }
} , {timestamps: true})

export const Note = mongoose.model("Note" , noteSchema)