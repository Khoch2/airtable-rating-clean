import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Airtable-Konfiguration
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appItENfteYmYF2Uk";
const TABLE_ID = "tbl3kFfmqMlXJi8eh";

const airtable = axios.create({
  baseURL: `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`,
  headers: {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Hilfsfunktion
const escapeForFormula = (str = "") => String(str).replace(/'/g, "\\'");

// --- GET /api/server?search=Max
app.get("/", async (req, res) => {
  const q = (req.query.search || "").trim();
  if (!q) return res.json([]);

  try {
    const safe = escapeForFormula(q.toLowerCase());
    const formula = `OR(
      FIND('${safe}', LOWER({Vorname}))>0,
      FIND('${safe}', LOWER({Nachname}))>0,
      FIND('${safe}', LOWER({Vorname}&' '&{Nachname}))>0
    )`;

    const response = await airtable.get("", {
      params: { filterByFormula: formula, pageSize: 10 },
    });
    res.json(response.data.records || []);
  } catch (err) {
    console.error("Suche Fehler:", err.response?.data || err.message);
    res.status(500).json({ error: "Fehler bei der Suche in Airtable" });
  }
});

// --- POST /api/server (neuen Eintrag oder Update)
app.post("/", async (req, res) => {
  const { vorname, nachname, sterne, recordId } = req.body || {};
  try {
    if (recordId) {
      const response = await airtable.patch("", {
        records: [{ id: recordId, fields: { Sterne: Number(sterne) || 0 } }],
      });
      return res.json({ success: true, record: response.data.records?.[0] });
    } else {
      const response = await airtable.post("", {
        records: [
          {
            fields: {
              ID: randomUUID().slice(0, 8),
              Vorname: vorname?.trim() || "",
              Nachname: nachname?.trim() || "",
              Sterne: Number(sterne) || 0,
            },
          },
        ],
      });
      return res.json({ success: true, record: response.data.records?.[0] });
    }
  } catch (err) {
    console.error("Speicherfehler:", err.response?.data || err.message);
    res.status(500).json({ error: "Fehler beim Speichern in Airtable" });
  }
});

export default app;
