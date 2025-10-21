import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route";
import booksRoute from "./routes/books.route";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    data: { date: new Date() },
  });
});

app.use("/auth", authRoute);

app.use("/books", booksRoute);

// Placeholder routes (nanti kita tambahkan Auth, Books, dll)
app.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to IT Literature Shop API" });
});

export default app;