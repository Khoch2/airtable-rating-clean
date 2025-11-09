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
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }

      setLoading(true);
      setSearched(false);

      try {
        const res = await axios.get(`${apiBase}?search=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    };

    const delay = setTimeout(fetchResults, 400);
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

      // 🎉 Konfetti-Effekt
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

          {/* 🔄 Ladeanzeige */}
          {loading && (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p className="loading-text">Suche läuft...</p>
            </div>
          )}

          {/* Ergebnisse */}
          <AnimatePresence>
            {!loading && searched && query && (
              <motion.div
                className="results modern"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {results.length > 0 ? (
                  <>
                    <p className="results-header">
                      Wählen Sie Ihren Namen aus:
                    </p>
                    {results.map((r) => (
                      <div
                        key={r.id}
                        className="result-item modern-item"
                        onClick={() => handleSelect(r)}
                      >
                        <div className="name">
                          {r.fields.Vorname} {r.fields.Nachname}
                        </div>
                        {r.fields.Sterne ? (
                          <div className="stars-preview">
                            {"★".repeat(r.fields.Sterne)}
                          </div>
                        ) : (
                          <div className="stars-preview empty">Noch keine Bewertung</div>
                        )}
                      </div>
                    ))}
                    <div className="add-new-section">
                      <p className="small-info">
                        Ihr Name ist nicht in der Liste?
                      </p>
                      <button className="add-new-btn" onClick={handleNew}>
                        + Neue Bewertung hinzufügen
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="add-new-only">
                    <p>Keine Einträge gefunden.</p>
                    <button className="add-new-btn" onClick={handleNew}>
                      + Neue Bewertung für „{query}“ hinzufügen
                    </button>
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
