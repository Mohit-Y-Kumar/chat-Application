import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a username.");
      return;
    }
    if (trimmed.length > 20) {
      setError("Username must be 20 characters or fewer.");
      return;
    }
    onLogin(trimmed);
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1> Realtime Chat Application</h1>
        <p className="login-subtitle">Pick a username to join the conversation</p>
        <input
          type="text"
          placeholder="e.g. alex"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          autoFocus
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit">Join Chat</button>
      </form>
    </div>
  );
}
