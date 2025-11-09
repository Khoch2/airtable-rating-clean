import axios from "axios";

export default async function handler(req, res) {
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

  // 🔍 Suche
  if (req.method === "GET") {
    const q = (req.query.search || "").trim();
    if (!q) return res.status(200).json([]);

    try {
      const safe = q.toLowerCase().replace(/'/g, "\\'");
      const formula = `OR(
        FIND('${safe}', LOWER({Vorname}))>0,
        FIND('${safe}', LOWER({Nachname}))>0,
        FIND('${safe}', LOWER({Vorname}&' '&{Nachname}))>0
      )`;

      const response = await airtable.get("", {
        params: { filterByFormula: formula, pageSize: 10 },
      });

      return res.status(200).json(response.data.records || []);
    } catch (err) {
      console.error("Airtable-Fehler:", err.response?.data || err.message);
      return res.status(500).json({ error: "Fehler bei der Suche in Airtable" });
    }
  }

  // 💾 Speichern / Update
  if (req.method === "POST") {
    const { vorname, nachname, sterne, recordId, log } = req.body || {};
    try {
      const now = new Date();
      const formattedDate = now.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const formattedTime = now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (recordId) {
        const existing = await airtable.get(`/${recordId}`);
        const oldLog = existing.data.fields.LOG || "";
        const newLog = `${log}\n${oldLog}`.trim();

        const response = await airtable.patch("", {
          records: [
            {
              id: recordId,
              fields: { Sterne: sterne, LOG: newLog },
            },
          ],
        });
        return res.status(200).json({ success: true, record: response.data.records?.[0] });
      } else {
        const response = await airtable.post("", {
          records: [
            {
              fields: {
                ID: Math.random().toString(36).slice(2, 10),
                Vorname: vorname?.trim() || "",
                Nachname: nachname?.trim() || "",
                Sterne: sterne,
                LOG: `${formattedDate}, ${formattedTime} Uhr - neuer Eintrag erstellt`,
              },
            },
          ],
        });
        return res.status(200).json({ success: true, record: response.data.records?.[0] });
      }
    } catch (err) {
      console.error("Airtable-Fehler:", err.response?.data || err.message);
      return res.status(500).json({ error: "Fehler beim Speichern in Airtable" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
