import express  from 'express';
import cloudinary from './../lib/cloudinary.js';
import Book from '../models/Book.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();


//add book
router.post('/', protectRoute, async (req, res) => {
    try {
        const {title, caption, rating, image} = req.body;

        //check if all fields are provided
        if(!image || !caption || !title || !rating){
            return res.status(400).json({message: "Please fill all fields"});
        }

        //upload the image to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image);
        const imageUrl = uploadResponse.secure_url;

        //save to database

        const newBook = new Book({
            title,
            caption,
            rating,
            image: imageUrl,
            user: req.user._id
        });

        await newBook.save();

        res.status(201).json(newBook);
        
    } catch (error) {
        console.log("Error creating Book", error);
        res.status(500).json({message: error.message});
    }
});





//get all books
router.get("/",protectRoute, async (req, res) => {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 5;
        const skip = (page - 1) * limit;

        const books = await Book.find().sort({createdAt: -1}) //descending order
        .skip(skip).limit(limit).populate("user", "username profileImage");
        
        const totalBooks = await Book.countDocuments();

        res.send({
            books,
            currentPage: page,
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit)
        });

    } catch (error) {
        console.log("Error in getting books route",error);
        res.status(500).json({message: "Internal Server Error"});
    }
});





//delete book
router.delete("/:id", protectRoute, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        //if book not found
        if(!book) return res.status(404).json({message: "Book Not Found..."});

        //if found check if user is owner
        if(book.user.toString() !== req.user._id.toString())
            return res.status(401).json({message: "Unauthorized"});

        //delete the image from cloudinary as well
        if(book.image && book.image.includes("cloudinary")){
            try {
                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (deleteError) {
                console.log("Error deleting image from cloudinary...",deleteError);
            }
        }

        //delete book
        await book.deleteOne();
        res.json({message: "Book Deleted Successfully"});

    } catch (error) {
        console.log("Error deleting the book", error);
        res.status(500).json({message: "Internal Server Error..."});
    }
});





//get recommended books by logged in user
router.get("/user",protectRoute, async (req, res) => {
    try {
        const books =  await Book.find({user: req.user._id}).sort({createdAt: -1});
        res.json(books);
    } catch (error) {
        console.log("Get user books error",error);
        res.status(500).json({message: "Internal Server Error..."});
    }
});




export default router;