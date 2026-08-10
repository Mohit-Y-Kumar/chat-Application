import { useEffect, useRef, useState } from "react";
import useSocket from "../hooks/useSocket";
import { fetchMessages } from "../services/api";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import UserSidebar from "./UserSidebar";

export default function ChatWindow({ username, onLogout }) {
  const { socket, connected } = useSocket(username);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [loadError, setLoadError] = useState("");
  const bottomRef = useRef(null);
  const typingClearTimeout = useRef(null);

  // Load chat history once on mount (persists across refreshes)
  useEffect(() => {
    (async () => {
      try {
        const history = await fetchMessages();
        setMessages(history);
      } catch (err) {
        setLoadError("Could not load chat history. Is the backend running?");
      }
    })();
  }, []);

  // Wire up socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (message) => {
      setMessages((prev) => [...prev, message]);
      if (message.sender !== username) {
        socket.emit("messageRead", message._id);
      }
    };

    const handleStatusUpdate = ({ _id, status }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === _id ? { ...msg, status } : msg))
      );
    };

    // Fired when someone logs back in — all messages waiting for them
    // just got marked "read" in one batch on the server.
    const handleBulkRead = (ids) => {
      const idSet = new Set(ids);
      setMessages((prev) =>
        prev.map((msg) => (idSet.has(msg._id) ? { ...msg, status: "read" } : msg))
      );
    };

    const handleOnlineUsers = (users) => setOnlineUsers(users);

    const handleTyping = (user) => {
      if (user === username) return;
      setTypingUser(user);
      if (typingClearTimeout.current) clearTimeout(typingClearTimeout.current);
      typingClearTimeout.current = setTimeout(() => setTypingUser(null), 2000);
    };

    const handleStopTyping = (user) => {
      setTypingUser((current) => (current === user ? null : current));
    };

    const handleErrorMessage = (msg) => setLoadError(msg);

    socket.on("receiveMessage", handleReceive);
    socket.on("messageStatusUpdate", handleStatusUpdate);
    socket.on("messagesReadBulk", handleBulkRead);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userTyping", handleTyping);
    socket.on("userStopTyping", handleStopTyping);
    socket.on("errorMessage", handleErrorMessage);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messageStatusUpdate", handleStatusUpdate);
      socket.off("messagesReadBulk", handleBulkRead);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userTyping", handleTyping);
      socket.off("userStopTyping", handleStopTyping);
      socket.off("errorMessage", handleErrorMessage);
    };
  }, [socket, username]);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text) => {
    if (!socket || !connected) return;
    socket.emit("sendMessage", { sender: username, text });
  };

  const handleTyping = () => socket?.emit("typing", username);
  const handleStopTyping = () => socket?.emit("stopTyping", username);

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <div>
          <h2>Realtime Chat Application</h2>
          <span className={`connection-dot ${connected ? "online" : "offline"}`}>
            {connected ? "Connected" : "Reconnecting..."}
          </span>
        </div>
        <div className="chat-header-right">
          <span className="online-count">{onlineUsers.length} online</span>
          <button className="logout-btn" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      {loadError && <div className="banner-error">{loadError}</div>}

      <div className="chat-body">
        <UserSidebar currentUsername={username} onlineUsernames={onlineUsers} />

        <div className="chat-main">
          <main className="message-list">
            {messages.map((msg) => (
              <MessageBubble key={msg._id} message={msg} isOwn={msg.sender === username} />
            ))}
            {typingUser && <div className="typing-indicator">{typingUser} is typing...</div>}
            <div ref={bottomRef} />
          </main>

          <MessageInput
            onSend={handleSend}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            disabled={!connected}
          />
        </div>
      </div>
    </div>
  );
}