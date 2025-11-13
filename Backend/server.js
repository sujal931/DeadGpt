import express from "express";
import cors from "cors";
import { generate } from "./chatbot.js";


const app = express();

app.use(express.json());
app.use(cors());

const port = 3000;


app.post("/chat", async(req, res) => {
    try {
        const { message,convoId } = req.body;

        //validatiion
        if(!message || !convoId) {
           res.status(400).json({ message: "Please provide both message and conversation id"})
            return ;
        }

        const result = await generate(message,convoId);
        res.send({message: result});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send({error: "Something went wrong"});
    }
})




app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})