function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`message-row ${isOwn ? "own" : "other"}`}>
      <div className="message-bubble">
        {!isOwn && <span className="message-sender">{message.sender}</span>}
        <p className="message-text">{message.text}</p>
        <div className="message-meta">
          <span className="message-time">{formatTime(message.createdAt)}</span>
          {isOwn && message.status && (
            <span className={`message-status status-${message.status}`} >
              {message.status === "read" ? "seen" : message.status === "delivered" ? "seen" : "unseen"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
