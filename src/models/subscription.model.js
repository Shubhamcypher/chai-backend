import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type: mongoose.Schema.Types.ObjectId, //one who is subscribing
        ref: "User"
    },
    chnannel:{
        type: mongoose.Schema.Types.ObjectId, //to whom the 'subscriber' is subscribing
        ref: "User"
    }
},{timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)