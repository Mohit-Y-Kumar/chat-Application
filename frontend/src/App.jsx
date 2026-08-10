import { useState } from "react";
import Login from "./components/Login";
import ChatWindow from "./components/ChatWindow";

const STORAGE_KEY = "chat-app-username";

export default function App() {
  const [username, setUsername] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");

  const handleLogin = (name) => {
    sessionStorage.setItem(STORAGE_KEY, name);
    setUsername(name);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUsername("");
  };

  if (!username) {
    return <Login onLogin={handleLogin} />;
  }

  return <ChatWindow username={username} onLogout={handleLogout} />;
}
