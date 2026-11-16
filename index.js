import express from "express";
import path from 'path';
import appRouter from "./routes/index.js";
import { config } from "dotenv";
import { connectToDatabase } from "./db/index.js";

const app = express();
const __dirname = path.resolve();

// Serve static files
// Keep the legacy /static prefix for the existing VRS case study, and also
// serve the portfolio assets from the root so relative paths work at "/".
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

// CORS configuration (uncomment if needed)
/*
const corsOptions = {
  origin: 'http://localhost:8787', 
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
*/

config(); // Load environment variables

// Serve the main index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.use("/api/items", appRouter);

const PORT = process.env.PORT || 5000;

// Database connection and server start
// The portfolio is fully static, so keep the site available even when the
// optional VRS API database is unreachable. API routes still need MySQL.
connectToDatabase()
  .then(() => console.log("MySQL connection ready"))
  .catch((err) => {
    console.warn(
      "MySQL unavailable — serving the static portfolio. API endpoints will fail until the database is reachable.",
      err.message
    );
  })
  .finally(() => {
    app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
  });
