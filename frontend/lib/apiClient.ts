// frontend/lib/apiClient.ts
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// 🔐 Attach access token to requests
api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔄 Token refresh management
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// 🔄 Handle token refresh on 401 errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        logoutUser();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          "http://127.0.0.1:8000/users/refresh",
          new URLSearchParams({ refresh_token: refreshToken }),
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );

        const newAccessToken = (res.data as any).access_token;
        if (newAccessToken) {
          localStorage.setItem("access_token", newAccessToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        } else {
          throw new Error("No access token returned");
        }
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        logoutUser();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// 🚪 Helper: Logout user and redirect
function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  window.location.href = "/login";
}

// ✳️ Helper: Register new user
export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await api.post("/users/register", data);
  return res.data;
}

// ✳️ Helper: Login user (with form data)
export async function loginUser(data: {
  username: string;
  password: string;
}) {
  const formData = new FormData();
  formData.append("username", data.username);
  formData.append("password", data.password);

  const res = await fetch("http://127.0.0.1:8000/users/login", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }

  return res.json();
}

export default api;
