import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("laundry.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS laundry_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'dirty',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cleaned_at DATETIME
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/status", (req, res) => {
    const dirtyItems = db.prepare("SELECT * FROM laundry_items WHERE status = 'dirty' ORDER BY created_at ASC").all();
    res.json(dirtyItems);
  });

  app.post("/api/drop", (req, res) => {
    const { owner, type } = req.body;
    if (!owner || !type) {
      return res.status(400).json({ error: "Owner and type are required" });
    }
    const info = db.prepare("INSERT INTO laundry_items (owner, type) VALUES (?, ?)").run(owner, type);
    res.json({ id: info.lastInsertRowid, owner, type, status: 'dirty' });
  });

  app.post("/api/clean", (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Item ID is required" });
    }
    db.prepare("UPDATE laundry_items SET status = 'clean', cleaned_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Bulk clean for an owner
  app.post("/api/clean-all", (req, res) => {
    const { owner, type } = req.body;
    if (!owner || !type) {
      return res.status(400).json({ error: "Owner and type are required" });
    }
    db.prepare("UPDATE laundry_items SET status = 'clean', cleaned_at = CURRENT_TIMESTAMP WHERE owner = ? AND type = ? AND status = 'dirty'").run(owner, type);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
