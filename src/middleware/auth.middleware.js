import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protectRoute = async(req, res, next) => {
    try {
        //get token
        const token = req.header("Authorization").replace("Bearer ", "");
        
        //check if token is provided
        if(!token) return res.status(401).json({message: "No Authentication token, Access Denied.."});

        //verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        //find user
        const user = await User.findById(decoded.userId).select("-password");

        //if not found
        if(!user) return res.status(401).json({message: "Token is invalid.."});

        req.user = user;
        next();


    } catch (error) {
        console.error("Authentication Error.", error.message);
        res.status(401).json({message: "Token is not valid.."});
    }
};



export default protectRoute;