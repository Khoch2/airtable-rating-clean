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

  // 🔍 Suche
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
    const sterneValue = Number(record.fields.Sterne) || 0;
    setSelected(record);
    setSterne(sterneValue);
    setResults([]);
  };

  const handleNew = () => {
    const [vorname, ...rest] = query.trim().split(" ");
    setSelected({ isNew: true, vorname, nachname: rest.join(" ") });
    setSterne(0);
    setResults([]);
  };

  const updateStars = async (change) => {
    if (!selected) return;
    const newStars = Math.min(20, Math.max(0, sterne + change));
    if (newStars === sterne) return;

    const action = change > 0 ? "erhöht" : "verringert";
    const date = new Date();
    const formattedDate = date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const logEntry = `${formattedDate}, ${formattedTime} Uhr - von ${sterne} auf ${newStars} Sterne ${action}`;

    setSterne(newStars);
    setStatus("Speichere...");

    try {
      let payload;

      // 🆕 Neuer Eintrag
      if (selected.isNew && !selected.id) {
        const res = await axios.post(apiBase, {
          vorname: selected.vorname,
          nachname: selected.nachname,
          sterne: String(newStars), // jetzt Textfeld
          log: logEntry,
        });
        setSelected({
          ...selected,
          isNew: false,
          id: res.data?.record?.id,
          fields: res.data?.record?.fields || {},
        });
      } else {
        // ✏️ Bestehender Eintrag
        payload = {
          recordId: selected.id,
          sterne: String(newStars),
          log: logEntry,
        };
        await axios.post(apiBase, payload);
      }

      setStatus(`Bewertung ${action}!`);

      // 🎉 Konfetti bei Erhöhung
      if (change > 0) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Fehler beim Speichern.");
    }
  };

  return (
    <div className="wrapper">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        Gib deine Bewertung ab
      </motion.h1>

      {/* 🔍 Suche */}
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

          {loading && (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p className="loading-text">Suche läuft...</p>
            </div>
          )}

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
                    <p className="results-header">Wähle deinen Namen:</p>
                    {results.map((r) => (
                      <div
                        key={r.id}
                        className="result-item modern-item"
                        onClick={() => handleSelect(r)}
                      >
                        <div className="name">
                          {r.fields.Vorname} {r.fields.Nachname}
                        </div>
                        <div className="stars-preview">
                          ⭐ {r.fields.Sterne || 0}
                        </div>
                      </div>
                    ))}
                    <div className="add-new-section">
                      <p className="small-info">Dein Name ist nicht dabei?</p>
                      <button className="add-new-btn" onClick={handleNew}>
                        + Neuen Eintrag erstellen
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="add-new-only">
                    <p>Kein Eintrag gefunden.</p>
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

      {/* ⭐ Bewertung */}
      {selected && (
        <motion.div
          className="rating-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="rating-name">
            {selected.isNew
              ? `Neuer Eintrag für ${selected.vorname} ${selected.nachname}`
              : `${selected.fields?.Vorname || selected.vorname} ${
                  selected.fields?.Nachname || selected.nachname
                }`}
          </p>

          <div className="stars-number">{sterne} / 20</div>

          <div className="rating-controls">
            <button
              className="control-btn minus"
              onClick={() => updateStars(-1)}
              disabled={sterne <= 0}
            >
              −
            </button>
            <button
              className="control-btn plus"
              onClick={() => updateStars(1)}
              disabled={sterne >= 20}
            >
              +
            </button>
          </div>

          <button className="back" onClick={() => setSelected(null)}>
            Zurück zur Suche
          </button>

          {status && <p className="status">{status}</p>}
        </motion.div>
      )}
    </div>
  );
}
