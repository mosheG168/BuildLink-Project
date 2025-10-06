import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  withCredentials: false,
  paramsSerializer: (params) => new URLSearchParams(params).toString(),
});

// attach token
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers["x-auth-token"] = token;
  return cfg;
});

api.interceptors.response.use(
  (res) => {
    const t = res?.headers?.["x-auth-token"];
    if (t) localStorage.setItem("token", t);
    return res;
  },
  (err) => Promise.reject(err)
);

export default api;
