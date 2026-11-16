const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(
  /\/+$/,
  "",
);

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
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

export const api = {
  login: (credentials) => post("/auth/login", credentials),
  register: (details) => post("/auth/register", details),
  logout: () => post("/auth/logout", {}),
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
