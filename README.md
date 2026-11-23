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

The planned design palette is Warm Cream (`#F6F3E9`), Forest Green (`#315C43`), Sage Green (`#A5B89B`), Earth Brown (`#A47B5B`), Charcoal (`#282D29`), and White (`#FFFFFF`). Planned typography is Poppins for headings and Inter for body text.
