import express from "express"
import { config } from "dotenv"
import mongoose from "mongoose"
import cors from "cors"
import { v2 as cloudinary } from "cloudinary"
import multer from "multer"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import productRoute from "./routes/productRoute.js"
import stripeRoute from "./routes/stripeRoute.js"
import subscriberRoute from "./routes/subscriberRoute.js"
import { authRouter } from "./controllers/authController.js";
import emailRouter from "./routes/emailRouter.js"


config();

const app = express();

const allowedOrigins = ['https://online-course-template-theta.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));

app.listen(process.env.PORT, () => console.log(`Server running on ${process.env.PORT} PORT`));

mongoose
    .connect(process.env.mongoDb)
    .then(() => console.log('Database is connected'))
    .catch((error) => console.log(error));

app.use(express.json());

app.use('/product', productRoute);
app.use('/email', emailRouter);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use((req, res, next) => {
    req.cloudinary = cloudinary;
    next();
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'images',
        allowedFormats: ['jpeg', 'png', 'jpg'],
    }
});

const parser = multer({ storage: storage });

//ROUTE FOR UPLOADING THE FILE TO CLOUDINARY
app.post('/upload-image', parser.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        if (!req.file.path) {
            throw new Error('File uploaded, but no path available');
        }

        res.json({ secure_url: req.file.path });
    } catch (error) {
        console.error('Error during file upload: ', error);
        res.status(500).send('Internal server error');
    }
});

app.use('/stripe', stripeRoute)
app.use('/subscriber', subscriberRoute)
app.use('/auth', authRouter);