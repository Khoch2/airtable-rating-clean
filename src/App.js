import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

// Basis-URL für lokale Entwicklung oder Vercel
const apiBase =
  process.env.NODE_ENV === "production"
    ? "" // in Produktion ruft es automatisch die Serverless-Funktion auf
    : "http://localhost:5050";

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sterne, setSterne] = useState(0);
  const [status, setStatus] = useState("");

  // 🔍 Sofortsuche bei jeder Eingabe
  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 1) {
        setResults([]);
        return;
      }
      try {
        const res = await axios.get(`${apiBase}/api/search?q=${query}`);
        setResults(res.data);
      } catch {
        setResults([]);
      }
    };

    const delay = setTimeout(fetchResults, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (record) => {
    setSelected(record);
    setSterne(record.fields.Sterne || 0);
    setResults([]);
  };

  const handleNew = () => {
    const [vorname, ...rest] = query.trim().split(" ");
    const nachname = rest.join(" ");
    setSelected({ isNew: true, vorname, nachname });
    setSterne(0);
    setResults([]);
  };

  const handleSave = async () => {
    if (!selected) return;
    setStatus("Speichere...");
    try {
      if (selected.isNew) {
        await axios.post(`${apiBase}/api/create`, {
          vorname: selected.vorname,
          nachname: selected.nachname,
          sterne,
        });
        setStatus("Bewertung gespeichert!");
      } else {
        await axios.post(`${apiBase}/api/update`, {
          recordId: selected.id,
          sterne,
        });
        setStatus("Bewertung aktualisiert!");
      }
    } catch {
      setStatus("Fehler beim Speichern.");
    }
  };

  return (
    <div className="wrapper">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        Gib deine Bewertung ab
      </motion.h1>

      {!selected && (
        <div className="search">
          <input
            type="text"
            placeholder="Vor- und Nachname eingeben..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* Hinweisfeld */}
          <motion.p
            className="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: query ? 1 : 0 }}
          >
            Bitte gib deinen vollständigen Namen ein.
          </motion.p>

          <AnimatePresence>
            {query && (
              <motion.div
                className="results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {results.length > 0 ? (
                  results.map((r) => (
                    <div key={r.id} className="result-item" onClick={() => handleSelect(r)}>
                      {r.fields.Vorname} {r.fields.Nachname}
                    </div>
                  ))
                ) : (
                  <div className="result-item new" onClick={handleNew}>
                    ➕ Eine neue Bewertung für „{query}“ hinzufügen
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {selected && (
        <motion.div
          className="rating-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p>
            {selected.isNew
              ? `Neue Bewertung für ${selected.vorname} ${selected.nachname}`
              : `Bewertung für ${selected.fields.Vorname} ${selected.fields.Nachname}`}
          </p>

          <div className="stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={s <= sterne ? "filled" : ""}
                onClick={() => setSterne(s)}
              >
                ★
              </span>
            ))}
          </div>

          <button onClick={handleSave}>Speichern</button>
          <button className="back" onClick={() => setSelected(null)}>
            Zurück
          </button>
          {status && <p className="status">{status}</p>}
        </motion.div>
      )}
    </div>
  );
}
