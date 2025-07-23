import express from "express";
import User from './../models/User.js';
import jwt from "jsonwebtoken";

const router = express.Router();

//generate jwt token
const generateToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: "15d"});
}

router.post("/register", async (req, resp) => {
    try {
        const {email, username, password} = req.body;

        //check if any field is empty
        if(!username || !email || !password){
            return resp.status(400).json({message: "Please fill in all fields."});
        }

        //check if password is less than 6 char
        if(password.length < 6 ){
            return resp.status(400).json({message: "Password must be at least 6 characters"});
        }

        //check if username is less thean 3 char
        if(username.length < 3){
            return resp.status(400).json({message: "Username must be at least 3 characters"});
        }

        //check if email already exists
        const existingEmail = await User.findOne({email});
        if(existingEmail) { 
            return resp.status(400).json({message: "Email already exists.."});
        }
        //check if username already exists
        const existingUsername = await User.findOne({username});
        if(existingUsername){
            return resp.status(400).json({message: "Username already exists.."});
        }

        //get random avatar
        const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

        const user = new User({
            email,
            username,
            password,
            profileImage
        });

        //save user
        await user.save();

        const token = generateToken(user._id);

        resp.status(201).json({
            token,
            user:{
                _id:user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
        });

    } catch (error) {
        console.log("Error in register route",error);
        return resp.status(500).json({message: "Internal Server Error"});
    }
});


router.post("/login", async (req, resp) => {
    try {
        const {email, password } = req.body;
        if(!email || !password){
            return resp.status(400).json({message: "Email and password are required.."});
        }

        //check if user exists
        const user = await User.findOne({email});
        if(!user) return resp.status(400).json({message: "Invalid Credentails.."});


        //check if password is correct
        const isPasswordCorrect = await user.comparePassword(password);
        if(!isPasswordCorrect) return resp.status(400).json({message: "Invalid Credentials.."});

        //generate token
        const token = generateToken(user._id);
        resp.status(200).json({
            token,
            user:{
                _id:user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
        });

    } catch (error) {
        console.log("Error in login route",error);
        resp.status(500).json({message: "Internal Server Error.."});
    }
});



export default router;