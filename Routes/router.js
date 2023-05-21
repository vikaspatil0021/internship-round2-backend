import express from 'express';
import bcrypt from "bcrypt";
import Jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

import dotenv from "dotenv";
dotenv.config();

import { UserInfo, PostInfo } from '../models/models.js';

const router = express.Router();

const ensureToken = (req, res, next) => {
    const bHeader = req.headers["authorization"];
    if (typeof bHeader != 'undefined') {
        const bToken = (bHeader.split(' '))[1];
        req.token = bToken;

        next();
    } else {
        res.status(403).json({ msg: "Invalid Token" });
    }
}

// verifying the token
const verifyToken = (token) => {
    return Jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, data) => {
        if (err) {
            return { err: err.message };
        } else {
            return data;
        }
    })
}

router.post("/register", async (req, res) => {

    const { email, username, password } = req.body;

    try {
        const existingUser = await UserInfo.findOne({ username: username });
        if (existingUser) {
            return res.status(200).json({ error: "Looks like you already have an account. Log in!" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await UserInfo.create({
            email: email,
            username: username,
            password: hashPassword
        })
        const token = Jwt.sign({ username: user.username, id: user._id }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1d' });
        res.status(200).json({ token: token })

    } catch (error) {
        res.json({ error: error.message })

    }
})


router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const existingUser = await UserInfo.findOne({ username: username });
    if (!existingUser) {
        return res.status(200).json({ error: "user doesnot exists " });
    }


    const matchPassword = await bcrypt.compare(password, existingUser.password);

    if (!matchPassword) {
        return res.json({ error: "Wrong password" });
    }
    const token = Jwt.sign({ username: existingUser.username, id: existingUser._id }, process.env.TOKEN_SECRET_KEY, { expiresIn: '1d' });
    res.status(200).json({ token: token })



})

router.post('/sendMail',async(req,res)=>{
    const {email,otp}= req.body;


    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'vikaspatil2103b@gmail.com',
          pass: 'xilqjyzhongocyyx'
        }
      });
      
      var mailOptions = {
        from: 'vikaspatil2103b@gmail.com',
        to: email,
        subject: 'OTP',
        text: 'Your OTP is ' + otp
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            res.json({error:error.message});
        } else {
          res.json({EmailSent: info.response});
        }
      });
})

router.get('/posts',(req,res)=>{
    try {
        const posts = PostInfo.find();
        res.status(200).json(posts)
    } catch (error) {
        res.json(error.message);

    }
})

router.post('/resetPassword', async (req, res) => {
    const { email, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    try {
        await UserInfo.updateOne({ email }, { password: hashPassword });
        res.status(200).json("good");
    } catch (error) {
        res.json(error.message);
    }
});

router.post('/post/crud/:action', ensureToken, async (req, res) => {
    try {
        const { username, data } = req.body
        const action = req.params.action;


        if (verifyToken(req.token)) {

            var foundUser = await UserInfo.findOne({ username });
            if (action === 'create') {

                const newPost = new PostInfo({
                    userId:foundUser._id,
                    ...data

                })
                newPost.save()
                res.json({ message: " New Post created" })

            } else if (action === 'update') {
                await PostInfo.updateOne({ _id: data.Id }, { title: data.title, imageURL: data.imageURL });
                res.json("Post Updated")

            }else if (action === 'delete') {
                await PostInfo.deleteOne({ _id: data.Id });
                res.json("Post deleted")

            }
        } else {
            res.status(403).json('Invalid Token')
        }


    } catch (error) {
        res.status(200).json(error)
    }


})

export default router;