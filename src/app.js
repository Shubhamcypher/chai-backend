import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'



const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN, //which is set * means anyone can access
    credentials: true
}))

app.use(express.json({limit:"16kb"})) //setting up the limit
app.use(express.urlencoded({extended:true, limit:"16kb"})) //urlencoding technique which generalize the url space generation either of %20 or + means shubham kumar will be in url as shubham+kumar or shubham%20kumar
app.use(express.static("public")) //making the public folder as static for express
app.use(cookieParser()) //for creating and getting cookie session from users browser

export { app }