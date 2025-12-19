// import all modules -----
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// import all file and variables ----- 
import RouterMain from "../routes/route.js"
import connectDB from "../config/db.js"




// make main variabls --------------
const app = express();
app.use(express.json());
dotenv.config();
const PORT = process.env.PORT || 5000;
connectDB();

//  Alaow cors ===============

app.use(
    cors({
        origin: [
            "http://localhost:3000", 
            "http://127.0.0.1:3000",
            "https://back-nwex.onrender.com"
        ],
        credentials: true,
    })
);


// make routes  --------------
app.use("/test", (req, res) => {
    res.json({ sms: "This app is runnunig" })
})
app.use('/api', RouterMain);



console.log('PORT', PORT)
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
})