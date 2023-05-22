import mongoose from "mongoose";


const userSchema = mongoose.Schema({
    email:String,
    username:String,
    password:String

});

const postSchema = mongoose.Schema({
    title:String,
    username:String,
    comment:[],
    likes:[],
    imgURL:String
})

const UserInfo = mongoose.model("user",userSchema);
const PostInfo = mongoose.model("post",postSchema);


export {UserInfo, PostInfo};