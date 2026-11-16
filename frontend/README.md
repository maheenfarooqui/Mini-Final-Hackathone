# You Care Clinic frontend

## Run locally

1. Start the backend from `backend/` with `npm start`.
2. Set `MONGO_URI` and `JWT_SECRET` in the backend environment, and seed the first administrator as described in the [backend setup guide](../backend/README.md).
3. From `frontend/`, run `npm run dev`.

The frontend connects to `http://localhost:3000/api` by default. To use another backend URL, create a frontend `.env` file with:

```env
VITE_API_URL=https://your-backend.example/api
```

The API uses the backend's HTTP-only authentication cookie. The browser requests include credentials, so configure the backend `CLIENT_URL` to match the deployed frontend origin.

## Available scripts

- `npm run dev` — start the Vite development server.
- `npm run build` — create a production build in `dist/`.
- `npm run lint` — run ESLint.
- `npm run preview` — preview the production build.
