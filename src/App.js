import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import "./App.css";

const apiBase =
  process.env.NODE_ENV === "production"
    ? "/api/server"
    : "http://localhost:5050/api/server";

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sterne, setSterne] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false); // 👈 neu: Ladezustand

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) return setResults([]);
      setLoading(true); // Ladeanzeige starten
      try {
        const res = await axios.get(`${apiBase}?search=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false); // Ladeanzeige beenden
      }
    };
    const delay = setTimeout(fetchResults, 400); // kleine Verzögerung für flüssiges Tippen
    return () => clearTimeout(delay);
  }, [query]);

  const handleSelect = (record) => {
    setSelected(record);
    setSterne(record.fields.Sterne || 0);
    setResults([]);
  };

  const handleNew = () => {
    const [vorname, ...rest] = query.trim().split(" ");
    setSelected({ isNew: true, vorname, nachname: rest.join(" ") });
    setSterne(0);
    setResults([]);
  };

  const handleSave = async () => {
    if (!selected) return;
    setStatus("Speichere...");
    try {
      const payload = selected.isNew
        ? { vorname: selected.vorname, nachname: selected.nachname, sterne }
        : { recordId: selected.id, sterne };
      await axios.post(apiBase, payload);

      setStatus("Gespeichert!");

      // 🎉 Konfetti-Effekt starten
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => setStatus(""), 2500);
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
          <motion.p
            className="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: query ? 1 : 0 }}
          >
            Bitte gib deinen vollständigen Namen ein.
          </motion.p>

          {/* 🔄 Ladeindikator */}
          {loading && (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p className="loading-text">Suche läuft...</p>
            </div>
          )}

          {/* Ergebnisse */}
          <AnimatePresence>
            {!loading && query && (
              <motion.div
                className="results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Neu-Button immer oben */}
                <div className="result-item new" onClick={handleNew}>
                  ➕ Neue Bewertung für „{query}“ hinzufügen
                </div>

                {/* Gefundene Ergebnisse darunter */}
                {results.length > 0 &&
                  results.map((r) => (
                    <div
                      key={r.id}
                      className="result-item"
                      onClick={() => handleSelect(r)}
                    >
                      {r.fields.Vorname} {r.fields.Nachname}
                    </div>
                  ))}
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

          <button onClick={handleSave} disabled={status === "Speichere..."}>
            {status === "Speichere..." ? "Speichern..." : "Speichern"}
          </button>
          <button className="back" onClick={() => setSelected(null)}>
            Zurück
          </button>
          {status && <p className="status">{status}</p>}
        </motion.div>
      )}
    </div>
  );
}
