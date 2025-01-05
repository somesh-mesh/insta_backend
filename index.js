import express from "express";
import dotenv from "dotenv";
import connectDb from "./utils/db.js"; 
import userRoute from "./routes/userRoute.js"
dotenv.config();

const app = express();
app.use(express.json());

// const corsOptions = {
//   origin: "http://localhost:5173",
//   credentials: true,
// };

// app.use(cors(corsOptions));

connectDb();

const PORT = process.env.PORT || 3000;

app.use("/api/v1/user", userRoute);

app.get("/", (req, res) => {
  res.send("Hello developer!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
