const Message = require("../models/Message");

//   POST /api/messages
const sendMessage = async (req, res, next) => {
  try {
    const { sender, text } = req.body;

    if (!sender || !text) {
      return res.status(400).json({ message: "sender and text are required" });
    }

    const message = await Message.create({ sender, text });

   
    const io = req.app.get("io");
    if (io) {
      io.emit("receiveMessage", message);
    }

    res.status(201).json(message);
  } catch (err) {
    next(err); 
  }
};

//     Fetch chat history 
//    GET /api/messages
const getMessages = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json(messages.reverse());
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getMessages };
