const Message = require("../models/Message");
const User = require("../models/User");

// Keeps track of which username maps to which live socket connection.
// (Backed up in Mongo too, via User.isOnline / User.socketId, so a server
// restart doesn't leave stale "online" state.)
const onlineUsers = new Map(); // username -> socketId

const registerChatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // --- User joins with a username (dummy auth) ---
    socket.on("userJoin", async (username) => {
      try {
        if (!username || typeof username !== "string") return;

        socket.data.username = username;
        onlineUsers.set(username, socket.id);

        await User.findOneAndUpdate(
          { username },
          { username, isOnline: true, socketId: socket.id, lastSeen: new Date() },
          { upsert: true, new: true }
        );

        // Tell everyone who's online now
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));

        // This user just came online — mark every message NOT sent by them
        // that is still "sent" (i.e. never seen because they were offline)
        // as "read", then tell everyone so senders' ticks flip live.
        const unseen = await Message.find({
          sender: { $ne: username },
          status: { $ne: "read" },
        }).select("_id");

        if (unseen.length > 0) {
          const unseenIds = unseen.map((m) => m._id);
          await Message.updateMany(
            { _id: { $in: unseenIds } },
            { status: "read" }
          );
          io.emit("messagesReadBulk", unseenIds);
        }
      } catch (err) {
        console.error("userJoin error:", err.message);
        socket.emit("errorMessage", "Could not register user presence.");
      }
    });

    // --- New chat message ---
    socket.on("sendMessage", async ({ sender, text }) => {
      try {
        if (!sender || !text || !text.trim()) {
          socket.emit("errorMessage", "Message must include a sender and text.");
          return;
        }

        const message = await Message.create({ sender, text: text.trim(), status: "sent" });

        // Broadcast to ALL connected clients, including the sender,
        // so every client renders from the same source of truth (the DB record).
        io.emit("receiveMessage", message);
      } catch (err) {
        console.error("sendMessage error:", err.message);
        socket.emit("errorMessage", "Failed to send message. Please try again.");
      }
    });

    // --- Typing indicator (bonus) ---
    socket.on("typing", (username) => {
      socket.broadcast.emit("userTyping", username);
    });

    socket.on("stopTyping", (username) => {
      socket.broadcast.emit("userStopTyping", username);
    });

    // --- Read receipts (bonus) ---
    socket.on("messageRead", async (messageId) => {
      try {
        const updated = await Message.findByIdAndUpdate(
          messageId,
          { status: "read" },
          { new: true }
        );
        if (updated) {
          io.emit("messageStatusUpdate", { _id: updated._id, status: updated.status });
        }
      } catch (err) {
        console.error("messageRead error:", err.message);
      }
    });

    // --- Disconnect handling ---
    socket.on("disconnect", async () => {
      const username = socket.data.username;
      console.log(`Socket disconnected: ${socket.id} (${username || "unknown"})`);

      if (username) {
        onlineUsers.delete(username);
        try {
          await User.findOneAndUpdate(
            { username },
            { isOnline: false, socketId: null, lastSeen: new Date() }
          );
        } catch (err) {
          console.error("disconnect update error:", err.message);
        }
        io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      }
    });
  });
};

module.exports = registerChatSocket;