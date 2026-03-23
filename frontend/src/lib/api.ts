import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("meditrack_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("meditrack_token");
      localStorage.removeItem("meditrack_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  register: (data: any) => api.post("/api/auth/register", data),
  login: (data: any) => api.post("/api/auth/login", data),
  sendOtp: (email: string) => api.post(`/api/auth/otp/send?email=${encodeURIComponent(email)}`),
  verifyOtp: (email: string, token: string) =>
    api.post(`/api/auth/otp/verify?email=${encodeURIComponent(email)}&token=${token}`),
};

// ─── Patient ─────────────────────────────────────────────────
export const patientAPI = {
  getMe: () => api.get("/api/patients/me"),
  updateMe: (data: any) => api.patch("/api/patients/me", data),
  search: (q: string) => api.get(`/api/patients/search?q=${encodeURIComponent(q)}`),
  getSummary: (id: string) => api.get(`/api/patients/${id}/summary`),
};

// ─── Visits ──────────────────────────────────────────────────
export const visitsAPI = {
  myVisits: () => api.get("/api/visits/my"),
  getVisit: (id: string) => api.get(`/api/visits/${id}`),
  createVisit: (data: any) => api.post("/api/visits/", data),
  patientVisits: (patientId: string) => api.get(`/api/visits/patient/${patientId}`),
};

// ─── Reports ─────────────────────────────────────────────────
export const reportsAPI = {
  myReports: () => api.get("/api/reports/my"),
  uploadReport: (formData: FormData) =>
    api.post("/api/reports/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  patientReports: (patientId: string) => api.get(`/api/reports/patient/${patientId}`),
};

export default api;
