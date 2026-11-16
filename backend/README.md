# Clinic Appointment API

## Setup

Configure `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` in the backend environment. `JWTSECRECT_KEY` is also accepted for compatibility with the old backend's misspelled variable.

Create the first administrator by setting `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (at least 8 characters), then run:

```sh
npm run seed:admin
```

Public registration always creates a patient. Administrators create doctor accounts through the admin API.

## API

All protected routes accept a JWT in an `Authorization: Bearer <token>` header or the `token` HTTP-only cookie.

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/doctors?search=<name-or-specialization>` | Authenticated |
| GET | `/api/doctors/:id` | Authenticated |
| POST | `/api/appointments` | Patient |
| GET | `/api/appointments/my` | Patient |
| GET | `/api/appointments/doctor` | Doctor |
| PATCH | `/api/appointments/:id/status` | Assigned doctor (`approved` or `rejected`) |
| PATCH | `/api/appointments/:id/cancel` | Owning patient (pending only) |
| GET | `/api/admin/users` | Admin |
| POST | `/api/admin/doctors` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |
| PATCH | `/api/admin/users/:id/status` | Admin |
| GET | `/api/admin/appointments` | Admin |
| GET | `/api/admin/stats` | Admin |

Appointment creation expects `doctor`, `appointmentDate` (`YYYY-MM-DD`), `appointmentTime` (`HH:mm`), and `reason`. Doctor creation expects `name`, `email`, `password`, `specialization`, and `experience`. User activation expects `{ "isActive": true }` or `{ "isActive": false }`.
