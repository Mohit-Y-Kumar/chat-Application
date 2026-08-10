import { useEffect, useState } from "react";
import { fetchUsers } from "../services/api";

export default function UserSidebar({ currentUsername, onlineUsernames }) {
  const [allUsers, setAllUsers] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const users = await fetchUsers();
        setAllUsers(users);
      } catch (err) {
        setLoadError("Could not load user list.");
      }
    })();
  }, []);

  const onlineSet = new Set(onlineUsernames);

  const knownUsernames = new Set(allUsers.map((u) => u.username));
  const displayUsers = [...allUsers];
  if (!knownUsernames.has(currentUsername)) {
    displayUsers.push({ username: currentUsername });
  }

  displayUsers.sort((a, b) => a.username.localeCompare(b.username));

  return (
    <aside className="user-sidebar">
      <h3>People</h3>
      {loadError && <p className="sidebar-error">{loadError}</p>}
      <ul className="user-list">
        {displayUsers.map((user) => {
          const isOnline = onlineSet.has(user.username);
          const isMe = user.username === currentUsername;
          return (
            <li key={user.username} className="user-list-item">
              <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
              <span className="user-list-name">
                {user.username}
                {isMe && <span className="user-list-you"> (you)</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}