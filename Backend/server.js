import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { generate } from "./chatbot.js";

const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT || 3000;

app.post("/chat", async (req, res) => {
  try {
    const { message, convoId } = req.body;

    if (!message || !convoId) {
      return res
        .status(400)
        .json({ message: "Please provide both message and conversation id" });
    }

    const result = await generate(message, convoId);
    res.send({ message: result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Something went wrong" });
  }
});

// Wildcard route → always serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Correct PORT for Render
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
