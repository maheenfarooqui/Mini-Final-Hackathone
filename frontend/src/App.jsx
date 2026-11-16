import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const icons = {
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
  arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  doctor: <><path d="M12 2v6m-3-3h6" /><path d="M5 8h14v10a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M9 14h6m-3-3v6" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
  logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" /><path d="m9 12 2 2 4-4" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name] || icons.activity}
    </svg>
  );
}

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <span className="brand-mark"><Icon name="doctor" size={23} /></span>
      <span className="brand-name">You <span>Care</span><small>CLINIC MANAGEMENT</small></span>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [authNotice, setAuthNotice] = useState("");

  useEffect(() => {
    let active = true;
    api.me()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setBooting(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await api.logout();
    } catch (error) {
      setAuthNotice(`Signed out on this device. The clinic server could not confirm sign-out: ${error.message}`);
    }
    setUser(null);
  }

  if (booting) {
    return <div className="boot-screen"><span className="loader" /><p>Getting your clinic ready...</p></div>;
  }
  if (!user) return <AuthScreen onAuth={setUser} notice={authNotice} />;
  return <Workspace key={user.id || user._id} user={user} onLogout={handleLogout} />;
}

function AuthScreen({ onAuth, notice }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = mode === "login"
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      onAuth(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="showcase-orbit orbit-one" />
        <div className="showcase-orbit orbit-two" />
        <div className="showcase-dots" />
        <Brand />
        <div className="showcase-copy">
          <span className="eyebrow eyebrow-light"><span className="live-dot" /> YOUR HEALTH, IN GOOD HANDS</span>
          <h1>Care that feels<br />a little more <em>human.</em></h1>
          <p>Simple, thoughtful care — from finding the right doctor to keeping every appointment on track.</p>
          <div className="showcase-note">
            <span className="note-icon"><Icon name="shield" size={21} /></span>
            <span><strong>Care, made simple</strong><small>Trusted by patients and practitioners</small></span>
          </div>
        </div>
        <div className="showcase-bottom"><span>Thoughtful care. Better days.</span><span>01 — 03</span></div>
      </section>

      <section className="auth-panel">
        <div className="mobile-brand"><Brand /></div>
        <div className="auth-card">
          <span className="eyebrow">WELCOME TO YOU CARE</span>
          <h2>{mode === "login" ? "Good to see you." : "Let's get you started."}</h2>
          <p className="auth-intro">
            {mode === "login"
              ? "Sign in to continue to your clinic dashboard."
              : "Create your patient account and book your first visit."}
          </p>
          {notice && <div className="form-error auth-notice" role="status">{notice}</div>}
          <form onSubmit={submit} className="auth-form">
            {mode === "register" && (
              <label className="field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  placeholder="e.g. Alex Morgan"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={mode === "login" ? "Enter your password" : "At least 8 characters"}
                minLength={mode === "register" ? 8 : undefined}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary button-wide" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create patient account"}
              {!busy && <Icon name="arrow" size={18} />}
            </button>
          </form>
          <div className="auth-switch">
            {mode === "login" ? "New to You Care?" : "Already have an account?"}
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </div>
          <div className="auth-secure"><Icon name="shield" size={16} /> Your information stays private and secure.</div>
        </div>
        <div className="auth-footnote">YOU CARE CLINIC <span>•</span> HERE FOR YOUR HEALTH</div>
      </section>
    </main>
  );
}

const navByRole = {
  patient: [
    { id: "overview", label: "Overview", icon: "grid" },
    { id: "doctors", label: "Find a doctor", icon: "doctor" },
    { id: "appointments", label: "My appointments", icon: "calendar" },
  ],
  doctor: [
    { id: "overview", label: "Overview", icon: "grid" },
    { id: "requests", label: "Appointment requests", icon: "calendar" },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: "grid" },
    { id: "users", label: "Manage users", icon: "users" },
    { id: "appointments", label: "All appointments", icon: "calendar" },
  ],
};

const roleTitles = { patient: "Patient portal", doctor: "Doctor portal", admin: "Admin portal" };

function getDisplayName(user) {
  const name = typeof user?.name === "string" ? user.name.trim() : "";
  const emailName = typeof user?.email === "string" ? user.email.split("@")[0] : "";
  return name || emailName || "User";
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Workspace({ user, onLogout }) {
  const displayName = getDisplayName(user);
  const [section, setSection] = useState("overview");
  const [data, setData] = useState({ doctors: [], appointments: [], users: [], stats: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const refresh = useCallback(async (searchTerm = search) => {
    setBusy(true);
    setError("");
    try {
      if (user.role === "patient") {
        const appointments = await api.myAppointments();
        const doctors = section === "overview" || section === "doctors"
          ? await api.doctors(section === "doctors" ? searchTerm : "")
          : null;
        setData((current) => ({
          ...current,
          appointments: appointments.appointments || [],
          ...(doctors ? { doctors: doctors.doctors || [] } : {}),
        }));
      } else if (user.role === "doctor") {
        const result = await api.doctorAppointments();
        setData((current) => ({ ...current, appointments: result.appointments || [] }));
      } else {
        const [stats, appointments, users] = await Promise.all([
          section === "overview" ? api.adminStats() : Promise.resolve(null),
          section === "overview" || section === "appointments"
            ? api.adminAppointments()
            : Promise.resolve(null),
          section === "users" ? api.adminUsers() : Promise.resolve(null),
        ]);
        setData((current) => ({
          ...current,
          ...(stats ? { stats: stats.stats } : {}),
          ...(appointments ? { appointments: appointments.appointments || [] } : {}),
          ...(users ? { users: users.users || [] } : {}),
        }));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }, [user.role, section, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => refresh(), user.role === "patient" && section === "doctors" ? 280 : 0);
    return () => window.clearTimeout(timer);
  }, [refresh, user.role, section]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const title = useMemo(() => {
    const item = navByRole[user.role]?.find((entry) => entry.id === section);
    return item?.label || "Overview";
  }, [section, user.role]);

  async function updateAppointment(id, status) {
    try {
      await api.updateAppointment(id, status);
      setToast(`Appointment ${status}.`);
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function cancelAppointment(id) {
    try {
      await api.cancelAppointment(id);
      setToast("Your appointment was cancelled.");
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function bookAppointment(details) {
    await api.bookAppointment(details);
    setSelectedDoctor(null);
    setToast("Appointment request sent to your doctor.");
    setSection("appointments");
  }

  async function mutateUser(action, id, value) {
    try {
      if (action === "delete") await api.deleteUser(id);
      else await api.setUserStatus(id, value);
      setToast(action === "delete" ? "User removed." : "Account status updated.");
      await refresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function addDoctor(details) {
    try {
      await api.createDoctor(details);
      setToast("Doctor account created.");
      await refresh();
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  const nav = navByRole[user.role] || navByRole.patient;

  return (
    <div className="workspace">
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand"><Brand compact /></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${section === item.id ? "nav-item-active" : ""}`}
              onClick={() => { setSection(item.id); setMobileNav(false); setError(""); }}
            >
              <Icon name={item.icon} size={19} /><span>{item.label}</span>
              {section === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <div className="help-shape"><Icon name="activity" size={18} /></div>
          <strong>Here for your health</strong>
          <span>Your care journey, all in one place.</span>
        </div>
        <button className="profile-mini" onClick={onLogout} title="Sign out">
          <Avatar name={displayName} />
          <span className="profile-mini-copy"><strong>{displayName}</strong><small>{roleTitles[user.role]}</small></span>
          <Icon name="logout" size={17} />
        </button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><span /><span /><span /></button>
          <div className="breadcrumb"><span>{roleTitles[user.role]}</span><b>/</b><strong>{title}</strong></div>
          <div className="topbar-right">
            <span className="topbar-date"><Icon name="calendar" size={16} /> {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
            <span className="topbar-divider" />
            <button className="topbar-user" onClick={onLogout} title="Sign out"><Avatar name={displayName} /><span>{displayName}</span><Icon name="logout" size={16} /></button>
          </div>
        </header>

        <div className="page-content">
          {error && <div className="alert-error" role="alert"><span>{error}</span><button onClick={() => setError("")}><Icon name="close" size={16} /></button></div>}
          {busy && <div className="loading-line"><span /></div>}
          {user.role === "patient" && section === "overview" && (
            <PatientOverview user={user} data={data} onFind={() => setSection("doctors")} onBook={setSelectedDoctor} onAppointments={() => setSection("appointments")} />
          )}
          {user.role === "patient" && section === "doctors" && (
            <DoctorDirectory
              doctors={data.doctors}
              search={search}
              setSearch={setSearch}
              onBook={setSelectedDoctor}
            />
          )}
          {user.role === "patient" && section === "appointments" && (
            <AppointmentsPage
              role="patient"
              appointments={data.appointments}
              onCancel={cancelAppointment}
              onExplore={() => setSection("doctors")}
            />
          )}
          {user.role === "doctor" && section === "overview" && (
            <DoctorOverview user={user} appointments={data.appointments} onRequests={() => setSection("requests")} />
          )}
          {user.role === "doctor" && section === "requests" && (
            <AppointmentsPage role="doctor" appointments={data.appointments} onUpdate={updateAppointment} />
          )}
          {user.role === "admin" && section === "overview" && (
            <AdminOverview user={user} stats={data.stats} appointments={data.appointments} onUsers={() => setSection("users")} onAppointments={() => setSection("appointments")} />
          )}
          {user.role === "admin" && section === "users" && (
            <UsersPage users={data.users} onAddDoctor={addDoctor} onMutate={mutateUser} />
          )}
          {user.role === "admin" && section === "appointments" && (
            <AppointmentsPage role="admin" appointments={data.appointments} />
          )}
        </div>
        <footer className="page-footer"><span>© {new Date().getFullYear()} You Care Clinic</span><span>Thoughtful care. Better days.</span></footer>
      </main>

      {selectedDoctor && <BookingModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} onSubmit={bookAppointment} />}
      {toast && <div className="toast"><span className="toast-check"><Icon name="check" size={15} /></span>{toast}</div>}
    </div>
  );
}

function Avatar({ name = "You Care", size = "" }) {
  const safeName = typeof name === "string" ? name : "You Care";
  const initials = safeName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`avatar ${size}`}>{initials || "CP"}</span>;
}

function Eyebrow({ children }) {
  return <span className="eyebrow">{children}</span>;
}

function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="section-title">
      <div><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, note, icon, tone = "blue" }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}><Icon name={icon} size={20} /></div>
      <div className="metric-copy"><span>{label}</span><strong>{value ?? "—"}</strong><small>{note}</small></div>
    </article>
  );
}

function StatusPill({ status }) {
  const value = (status || "pending").toLowerCase();
  return <span className={`status-pill status-${value}`}>{value}</span>;
}

function PatientOverview({ user, data, onFind, onBook, onAppointments }) {
  const firstName = getDisplayName(user).split(/\s+/)[0];
  const appointments = data.appointments;
  const pending = appointments.filter((appointment) => appointment.status === "pending").length;
  const approved = appointments.filter((appointment) => appointment.status === "approved").length;
  const upcoming = appointments.filter((appointment) => ["pending", "approved"].includes(appointment.status))
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)).slice(0, 3);

  return (
    <>
      <section className="welcome-banner patient-banner">
        <div className="welcome-copy">
          <Eyebrow>YOUR CARE, AT A GLANCE</Eyebrow>
          <h1>Good to see you, {firstName}<span className="wave">.</span></h1>
          <p>Taking care of yourself starts with one small step. What can we help with today?</p>
          <button className="button button-dark" onClick={onFind}>Find your doctor <Icon name="arrow" size={17} /></button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-circle art-circle-one" /><div className="art-circle art-circle-two" />
          <div className="art-card"><span className="art-plus">+</span><span className="art-card-label">CARE, CONNECTED</span><strong>Your health<br />comes first.</strong><span className="art-card-bottom"><Icon name="activity" size={17} /> Here for you</span></div>
          <div className="art-orbit" />
        </div>
        <span className="banner-number">01 / YOUR HEALTH</span>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Total appointments" value={appointments.length} note="Across your care journey" icon="calendar" />
        <MetricCard label="Awaiting confirmation" value={pending} note="Your doctor will respond soon" icon="clock" tone="orange" />
        <MetricCard label="Confirmed visits" value={approved} note="You're all set" icon="check" tone="green" />
      </section>

      <div className="content-grid">
        <section className="panel upcoming-panel">
          <div className="panel-heading"><div><Eyebrow>KEEPING YOU ON TRACK</Eyebrow><h2>Upcoming appointments</h2></div><button className="text-button" onClick={onAppointments}>See all <Icon name="arrow" size={16} /></button></div>
          {upcoming.length ? (
            <div className="appointment-list">
              {upcoming.map((appointment) => <AppointmentRow key={appointment._id} appointment={appointment} role="patient" />)}
            </div>
          ) : <EmptyState icon="calendar" title="Nothing on your calendar yet" text="Find a doctor and book a visit whenever you're ready." action={<button className="text-button" onClick={onFind}>Explore doctors <Icon name="arrow" size={16} /></button>} />}
        </section>
        <section className="panel care-panel">
          <div className="care-panel-top"><span className="care-badge"><Icon name="doctor" size={17} /> PERSONALIZED CARE</span><span className="care-cross">+</span></div>
          <div><Eyebrow>THE RIGHT CARE, RIGHT HERE</Eyebrow><h2>A good conversation is a great place to start.</h2><p>Browse our doctors, explore their specialties, and find someone who feels right for you.</p></div>
          <button className="button button-outline" onClick={onFind}>Meet our doctors <Icon name="arrow" size={16} /></button>
        </section>
      </div>

      {data.doctors.length > 0 && (
        <section className="doctor-preview">
          <div className="panel-heading"><div><Eyebrow>MEET YOUR CARE TEAM</Eyebrow><h2>Doctors you can trust</h2></div><button className="text-button" onClick={onFind}>View directory <Icon name="arrow" size={16} /></button></div>
          <div className="doctor-grid doctor-grid-preview">{data.doctors.slice(0, 3).map((doctor, index) => <DoctorCard key={doctor._id} doctor={doctor} index={index} onBook={onBook} />)}</div>
        </section>
      )}
    </>
  );
}

function DoctorDirectory({ doctors, search, setSearch, onBook }) {
  return (
    <>
      <SectionTitle
        eyebrow="YOUR CARE TEAM"
        title="Find your doctor."
        description="A great care journey starts with the right person. Browse our specialists and find a good fit."
        action={<span className="directory-count">{doctors.length} {doctors.length === 1 ? "doctor" : "doctors"} available</span>}
      />
      <form className="search-bar" onSubmit={(event) => event.preventDefault()}>
        <Icon name="search" size={19} />
        <input aria-label="Search doctors" placeholder="Search by doctor or specialty..." value={search} onChange={(event) => setSearch(event.target.value)} />
        {search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="Clear search"><Icon name="close" size={17} /></button>}
        <span className="search-shortcut">NAME OR SPECIALTY</span>
      </form>
      {doctors.length ? (
        <div className="doctor-grid">{doctors.map((doctor, index) => <DoctorCard key={doctor._id} doctor={doctor} index={index} onBook={onBook} />)}</div>
      ) : <EmptyState icon="doctor" title="No doctors found" text="Try another name or specialty, or check back later." />}
    </>
  );
}

const doctorColors = ["doctor-avatar-blue", "doctor-avatar-lilac", "doctor-avatar-mint", "doctor-avatar-peach"];

function DoctorCard({ doctor, index = 0, onBook }) {
  return (
    <article className="doctor-card">
      <div className="doctor-card-top">
        <div className={`doctor-avatar ${doctorColors[index % doctorColors.length]}`}><Icon name="doctor" size={25} /></div>
        <span className="available-tag"><span /> Available</span>
      </div>
      <div className="doctor-info">
        <h3>Dr. {doctor.name}</h3>
        <span className="specialty">{doctor.specialization || "General practitioner"}</span>
        <div className="doctor-experience"><Icon name="activity" size={15} /> {doctor.experience || 0} years of experience</div>
      </div>
      <button className="button button-doctor" onClick={() => onBook(doctor)}>Book an appointment <Icon name="arrow" size={16} /></button>
    </article>
  );
}

function DoctorOverview({ user, appointments, onRequests }) {
  const firstName = getDisplayName(user).split(/\s+/)[0];
  const pending = appointments.filter((item) => item.status === "pending").length;
  const approved = appointments.filter((item) => item.status === "approved").length;
  const rejected = appointments.filter((item) => item.status === "rejected").length;
  const recent = [...appointments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  return (
    <>
      <section className="welcome-banner doctor-banner">
        <div className="welcome-copy">
          <Eyebrow>DOCTOR WORKSPACE</Eyebrow>
          <h1>{greeting()}, Dr. {firstName}<span className="wave">.</span></h1>
          <p>Here is what's happening with your patients and appointment requests today.</p>
          <button className="button button-dark" onClick={onRequests}>Review requests <Icon name="arrow" size={17} /></button>
        </div>
        <div className="doctor-banner-art"><div className="doctor-art-circle" /><div className="doctor-art-plus">+</div><div className="doctor-art-card"><Icon name="doctor" size={32} /><span>YOUR PRACTICE</span><strong>Care begins<br />with listening.</strong></div><div className="doctor-art-label">PATIENT FIRST</div></div>
        <span className="banner-number">02 / YOUR PRACTICE</span>
      </section>
      <section className="metrics-grid">
        <MetricCard label="Total appointments" value={appointments.length} note="All time" icon="calendar" />
        <MetricCard label="New requests" value={pending} note="Waiting for your response" icon="clock" tone="orange" />
        <MetricCard label="Approved visits" value={approved} note="Scheduled with patients" icon="check" tone="green" />
        <MetricCard label="Declined" value={rejected} note="Requests not accepted" icon="close" tone="lilac" />
      </section>
      <section className="panel">
        <div className="panel-heading"><div><Eyebrow>YOUR PATIENTS</Eyebrow><h2>Recent appointment activity</h2></div><button className="text-button" onClick={onRequests}>All requests <Icon name="arrow" size={16} /></button></div>
        {recent.length ? <div className="appointment-list">{recent.map((appointment) => <AppointmentRow key={appointment._id} appointment={appointment} role="doctor" />)}</div> : <EmptyState icon="calendar" title="No appointment requests yet" text="New patient requests will appear here." />}
      </section>
    </>
  );
}

function AdminOverview({ user, stats, appointments, onUsers, onAppointments }) {
  const firstName = getDisplayName(user).split(/\s+/)[0];
  const recent = [...appointments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  return (
    <>
      <section className="welcome-banner admin-banner">
        <div className="welcome-copy">
          <Eyebrow>CLINIC CONTROL CENTER</Eyebrow>
          <h1>{greeting()}, {firstName}<span className="wave">.</span></h1>
          <p>A clear view of your clinic, the people in your care, and everything happening today.</p>
          <button className="button button-dark" onClick={onUsers}>Manage your team <Icon name="arrow" size={17} /></button>
        </div>
        <div className="admin-banner-art"><div className="admin-shape admin-shape-one" /><div className="admin-shape admin-shape-two" /><div className="admin-stamp"><Icon name="shield" size={28} /><span>YOU CARE</span><strong>Care<br />together.</strong></div><span className="admin-art-plus">+</span></div>
        <span className="banner-number">03 / CLINIC OVERVIEW</span>
      </section>
      <section className="metrics-grid">
        <MetricCard label="Registered patients" value={stats?.patients} note="Patient accounts" icon="users" />
        <MetricCard label="Clinic doctors" value={stats?.doctors} note="Care professionals" icon="doctor" tone="green" />
        <MetricCard label="Total appointments" value={stats?.appointments} note="Across your clinic" icon="calendar" tone="orange" />
      </section>
      <section className="panel">
        <div className="panel-heading"><div><Eyebrow>THE LATEST</Eyebrow><h2>Recent appointments</h2></div><button className="text-button" onClick={onAppointments}>All appointments <Icon name="arrow" size={16} /></button></div>
        {recent.length ? <div className="appointment-list">{recent.map((appointment) => <AppointmentRow key={appointment._id} appointment={appointment} role="admin" />)}</div> : <EmptyState icon="calendar" title="Your clinic is ready" text="Appointments will appear here as patients start booking." />}
      </section>
    </>
  );
}

function AppointmentsPage({ role, appointments, onCancel, onUpdate, onExplore }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? appointments : appointments.filter((item) => item.status === filter);
  const title = role === "patient" ? "Your appointments." : role === "doctor" ? "Appointment requests." : "Clinic appointments.";
  const desc = role === "patient"
    ? "All your visits in one place. Pending requests can be cancelled if plans change."
    : role === "doctor"
      ? "Review patient requests and keep your schedule up to date."
      : "A complete view of appointments across the clinic.";
  return (
    <>
      <SectionTitle eyebrow={role === "admin" ? "CLINIC ACTIVITY" : "YOUR SCHEDULE"} title={title} description={desc} action={role === "patient" ? <button className="button button-primary" onClick={onExplore}><Icon name="plus" size={17} /> Book a visit</button> : null} />
      <section className="panel appointment-page-panel">
        <div className="list-toolbar">
          <div className="list-count"><strong>{filtered.length}</strong> {filter === "all" ? "appointments" : `${filter} appointments`}</div>
          <label className="filter-select"><Icon name="activity" size={16} /><select aria-label="Filter appointments" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option></select></label>
        </div>
        {filtered.length ? (
          <div className="appointment-list">
            {filtered.map((appointment) => <AppointmentRow key={appointment._id} appointment={appointment} role={role} onCancel={onCancel} onUpdate={onUpdate} />)}
          </div>
        ) : <EmptyState icon="calendar" title="No appointments here" text={filter === "all" ? "There are no appointments to show just yet." : `No ${filter} appointments at the moment.`} action={role === "patient" ? <button className="text-button" onClick={onExplore}>Find a doctor <Icon name="arrow" size={16} /></button> : null} />}
      </section>
    </>
  );
}

function AppointmentRow({ appointment, role, onCancel, onUpdate }) {
  const person = role === "doctor" ? appointment.patient : appointment.doctor;
  const title = role === "doctor"
    ? person?.name || "Patient"
    : role === "admin"
      ? `${appointment.patient?.name || "Patient"} · ${appointment.doctor?.name ? `Dr. ${appointment.doctor.name}` : "Doctor"}`
      : person?.name ? `Dr. ${person.name}` : "Doctor";
  const subtitle = role === "doctor"
    ? person?.email || "Patient appointment"
    : role === "admin"
      ? appointment.doctor?.specialization || "Clinic appointment"
      : person?.specialization || "Clinic visit";
  const date = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : "Date to be confirmed";
  return (
    <article className="appointment-row">
      <div className="appointment-date-block"><span>{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }).toUpperCase() : "TBD"}</span><strong>{appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString(undefined, { day: "2-digit", timeZone: "UTC" }) : "—"}</strong></div>
      <div className="appointment-person"><Avatar name={role === "admin" ? appointment.patient?.name || "Patient" : person?.name || "You Care"} /><div><strong>{title}</strong><span>{subtitle}</span></div></div>
      <div className="appointment-when"><span>{date}</span><small><Icon name="clock" size={14} /> {appointment.appointmentTime || "Time TBD"}</small></div>
      <StatusPill status={appointment.status} />
      {role === "doctor" && appointment.status === "pending" && (
        <div className="row-actions"><button className="icon-action action-approve" title="Approve appointment" onClick={() => onUpdate(appointment._id, "approved")}><Icon name="check" size={17} /></button><button className="icon-action action-reject" title="Reject appointment" onClick={() => onUpdate(appointment._id, "rejected")}><Icon name="close" size={17} /></button></div>
      )}
      {role === "patient" && appointment.status === "pending" && <button className="row-cancel" onClick={() => onCancel(appointment._id)}>Cancel</button>}
      {appointment.reason && <span className="appointment-reason" title={appointment.reason}>{appointment.reason}</span>}
    </article>
  );
}

function UsersPage({ users, onAddDoctor, onMutate }) {
  const [role, setRole] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const visibleUsers = users.filter((user) => {
    const matchesRole = role === "all" || user.role === role;
    const matchesQuery = `${getDisplayName(user)} ${user.email || ""} ${user.specialization || ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesRole && matchesQuery;
  });
  return (
    <>
      <SectionTitle
        eyebrow="YOUR CLINIC TEAM"
        title="People make the care."
        description="Manage patient accounts and build your team of trusted doctors."
        action={<button className="button button-primary" onClick={() => setShowForm(!showForm)}><Icon name="plus" size={17} /> Add a doctor</button>}
      />
      {showForm && <DoctorForm onSubmit={async (details) => { const created = await onAddDoctor(details); if (created) setShowForm(false); }} onCancel={() => setShowForm(false)} />}
      <section className="panel users-panel">
        <div className="users-toolbar">
          <div><Eyebrow>PEOPLE DIRECTORY</Eyebrow><h2>Manage users <span className="user-total">{users.length}</span></h2></div>
          <div className="user-filters">
            <label className="user-search"><Icon name="search" size={17} /><input placeholder="Search people..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search users" /></label>
            <select className="user-role-filter" value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role"><option value="all">All roles</option><option value="doctor">Doctors</option><option value="patient">Patients</option><option value="admin">Admins</option></select>
          </div>
        </div>
        <div className="user-table-wrap">
          <table className="user-table">
            <thead><tr><th>PERSON</th><th>ROLE</th><th>SPECIALTY</th><th>ACCOUNT</th><th className="table-actions">ACTIONS</th></tr></thead>
            <tbody>
              {visibleUsers.map((person) => (
                <tr key={person._id}>
                  <td><div className="table-person"><Avatar name={getDisplayName(person)} /><span><strong>{getDisplayName(person)}</strong><small>{person.email}</small></span></div></td>
                  <td><span className={`role-tag role-${person.role}`}>{person.role}</span></td>
                  <td>{person.role === "doctor" ? person.specialization || "—" : "—"}</td>
                  <td><span className={`account-state ${person.isActive ? "account-active" : "account-inactive"}`}><i />{person.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="table-actions">{person.role !== "admin" && <div className="user-actions"><button className="text-action" onClick={() => onMutate("status", person._id, !person.isActive)}>{person.isActive ? "Deactivate" : "Activate"}</button><button className="delete-action" onClick={() => { if (window.confirm(`Delete ${getDisplayName(person)} and related appointments?`)) onMutate("delete", person._id); }} title="Delete user"><Icon name="close" size={17} /></button></div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleUsers.length && <EmptyState icon="users" title="No matching users" text="Try changing your search or role filter." />}
        </div>
      </section>
    </>
  );
}

function DoctorForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", specialization: "", experience: "" });
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const created = await onSubmit({ ...form, experience: Number(form.experience) });
    setBusy(false);
    if (created) setForm({ name: "", email: "", password: "", specialization: "", experience: "" });
  }
  return (
    <form className="doctor-form panel" onSubmit={submit}>
      <div className="doctor-form-heading"><div><Eyebrow>GROW YOUR CARE TEAM</Eyebrow><h2>New doctor account</h2></div><button type="button" className="icon-action" onClick={onCancel} aria-label="Close form"><Icon name="close" size={18} /></button></div>
      <div className="doctor-form-grid">
        <label className="field"><span>Full name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Doctor's name" required /></label>
        <label className="field"><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="doctor@clinic.com" required /></label>
        <label className="field"><span>Specialization</span><input value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} placeholder="e.g. Cardiology" required /></label>
        <label className="field"><span>Years of experience</span><input type="number" min="0" value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} placeholder="0" required /></label>
        <label className="field doctor-password-field"><span>Temporary password</span><input type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" required /></label>
      </div>
      <div className="doctor-form-actions"><button type="button" className="button button-quiet" onClick={onCancel}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Creating..." : "Create account"} <Icon name="arrow" size={16} /></button></div>
    </form>
  );
}

function BookingModal({ doctor, onClose, onSubmit }) {
  const [form, setForm] = useState({ appointmentDate: "", appointmentTime: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit({ ...form, doctor: doctor._id });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <div className="modal-top"><span className="modal-doctor-icon"><Icon name="doctor" size={23} /></span><button className="icon-action" onClick={onClose} aria-label="Close"><Icon name="close" size={19} /></button></div>
        <Eyebrow>LET'S GET YOU THE RIGHT CARE</Eyebrow>
        <h2 id="booking-title">Book a visit with<br />Dr. {doctor.name}.</h2>
        <p className="modal-specialty">{doctor.specialization} <span>·</span> {doctor.experience || 0} years experience</p>
        <form className="booking-form" onSubmit={submit}>
          <div className="booking-fields">
            <label className="field"><span>Preferred date</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={form.appointmentDate} onChange={(event) => setForm({ ...form, appointmentDate: event.target.value })} required /></label>
            <label className="field"><span>Preferred time</span><input type="time" value={form.appointmentTime} onChange={(event) => setForm({ ...form, appointmentTime: event.target.value })} required /></label>
          </div>
          <label className="field"><span>What would you like help with?</span><textarea rows="3" maxLength="1000" placeholder="A short note for your doctor..." value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} required /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary button-wide" disabled={busy}>{busy ? "Sending request..." : "Request appointment"} {!busy && <Icon name="arrow" size={17} />}</button>
          <p className="booking-footnote"><Icon name="clock" size={14} /> Your appointment is pending until the doctor confirms.</p>
        </form>
      </section>
    </div>
  );
}

function EmptyState({ icon, title, text, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={22} /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export default App;
