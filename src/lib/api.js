const API_BASE =
  import.meta.env.VITE_API_BASE || "https://displine-backend.onrender.com";

export const apiFetch = async (
  path,
  { token, method = "GET", body } = {}
) => {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json();
};

