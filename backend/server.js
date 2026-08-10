require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const messageRoutes = require("./routes/messageRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const registerChatSocket = require("./sockets/chatSocket");

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

connectDB();

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health check
app.get("/", (req, res) => res.json({ status: "Chat API running" }));

// REST routes
app.use("/api/messages", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Make io accessible inside REST controllers (req.app.get("io"))
app.set("io", io);

registerChatSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
