# EcoLoop - Smart Campus Resource Exchange Platform

EcoLoop is a campus marketplace for students to list, discover, request, and
exchange resources. It uses a React/Vite frontend and an Express/MongoDB API.

## Project structure

- `client/` - React and Vite frontend
- `server/` - Express backend with MongoDB and Cloudinary integrations

## Run locally

Configure the required server settings in `server/.env` without committing or
sharing credentials. Start the backend and frontend in separate terminals:

```powershell
cd server
npm start
```

```powershell
cd client
npm run dev
```

The backend listens on port 5000 and the Vite frontend on port 5173 by default.
The backend also supports `npm run dev` for development with automatic restarts.

For the frontend, copy `client/.env.example` to `client/.env.local` and set
`VITE_API_URL` if the API is not running at `http://localhost:5000/api`.

## Deploy

The app is configured for a Render API and a Vercel frontend.

For the easiest setup, create the Vercel project first and note its assigned
domain. Deploy the Render service with that domain as `CLIENT_URL`, then set the
Render service URL as `VITE_API_URL` in Vercel and deploy the frontend.

### Backend on Render

1. Create a MongoDB database (for example, on MongoDB Atlas) and make sure its
   network access rules allow connections from Render.
2. In Render, create a Blueprint from this repository using the root
   `render.yaml`.
3. Set the Blueprint's `MONGO_URI` to the database connection string and
   `CLIENT_URL` to the Vercel frontend origin, such as
   `https://ecoloop.vercel.app` (no trailing slash). Render generates
   `JWT_SECRET` automatically.
4. Once deployed, confirm the service health check at `/api/health` succeeds.

`CLIENT_URL` accepts a comma-separated list of exact browser origins if you
also need to allow a custom domain. Do not use a trailing slash.

Optional Render environment variables:

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
  `CLOUDINARY_API_SECRET` enable Cloudinary image uploads.
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_STUDENT_ID`, and `ADMIN_PASSWORD`
  create the initial admin account when all four are set. Remove or unset
  these after the account has been created.

### Frontend on Vercel

1. Import the repository into Vercel and set the project **Root Directory** to
   `client`. Vercel uses `client/vercel.json` to serve client-side routes.
2. Add the environment variable `VITE_API_URL` with the full Render API URL,
   for example `https://ecoloop-api.onrender.com/api`.
3. Deploy or redeploy the project after setting the variable. Vite embeds this
   value at build time, so changing it requires a new deployment.
4. If the Vercel domain changes, update Render's `CLIENT_URL` and redeploy the
   Render service.

The frontend variable is public by design; never put credentials or secrets in
`VITE_*` variables. Keep database credentials and `JWT_SECRET` in Render's
environment settings only.

The planned design palette is Warm Cream (`#F6F3E9`), Forest Green (`#315C43`), Sage Green (`#A5B89B`), Earth Brown (`#A47B5B`), Charcoal (`#282D29`), and White (`#FFFFFF`). Planned typography is Poppins for headings and Inter for body text.
