const localApiBase =
  typeof window === "undefined"
    ? "http://localhost:3000/api"
    : `${window.location.protocol}//${window.location.hostname}:3000/api`;
const configuredApiBase = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
const API_BASE = configuredApiBase
  ? /\/api$/i.test(configuredApiBase)
    ? configuredApiBase
    : `${configuredApiBase}/api`
  : localApiBase;
const TOKEN_KEY = "you-care-session-token";

async function request(path, options = {}) {
  const token = typeof window === "undefined" ? null : window.sessionStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || "Something went wrong. Please try again.");
  }
  return payload;
}

function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body) });
}

function patch(path, body) {
  return request(path, { method: "PATCH", body: JSON.stringify(body) });
}

async function authenticate(path, credentials) {
  const result = await post(path, credentials);
  if (result.token && typeof window !== "undefined") {
    window.sessionStorage.setItem(TOKEN_KEY, result.token);
  }
  return result;
}

export const api = {
  login: (credentials) => authenticate("/auth/login", credentials),
  register: (details) => authenticate("/auth/register", details),
  logout: async () => {
    try {
      return await post("/auth/logout", {});
    } finally {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(TOKEN_KEY);
      }
    }
  },
  me: () => request("/auth/me"),
  doctors: (search = "") =>
    request(`/doctors${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  bookAppointment: (details) => post("/appointments", details),
  myAppointments: () => request("/appointments/my"),
  doctorAppointments: () => request("/appointments/doctor"),
  cancelAppointment: (id) => patch(`/appointments/${encodeURIComponent(id)}/cancel`, {}),
  updateAppointment: (id, status) =>
    patch(`/appointments/${encodeURIComponent(id)}/status`, { status }),
  adminStats: () => request("/admin/stats"),
  adminUsers: (role = "") =>
    request(`/admin/users${role ? `?role=${encodeURIComponent(role)}` : ""}`),
  adminAppointments: () => request("/admin/appointments"),
  createDoctor: (details) => post("/admin/doctors", details),
  deleteUser: (id) => request(`/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
  setUserStatus: (id, isActive) =>
    patch(`/admin/users/${encodeURIComponent(id)}/status`, { isActive }),
};
