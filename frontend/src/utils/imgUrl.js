const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const imgUrl = (url) =>
  !url ? null : url.startsWith("http") ? url : `${API_BASE}${url}`;
