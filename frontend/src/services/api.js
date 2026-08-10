import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 8000,
});

export const fetchMessages = async () => {
  const { data } = await api.get("/messages");
  return data;
};

export const postMessage = async (sender, text) => {
  const { data } = await api.post("/messages", { sender, text });
  return data;
};

export default api;
