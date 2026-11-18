import React, { useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExtract = async () => {
    if (!notes.trim()) {
      setError("Please paste your meeting notes first.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://localhost:5000/api/extract", { notes });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // পুরো result copy করার function
  const copyAll = () => {
    if (!result) return;
    const text = `
📌 DISCUSSION POINTS
${(result.discussionPoints || []).map((p) => `• ${p}`).join("\n") || "None"}

✅ DECISIONS
${(result.decisions || []).map((d) => `• ${d}`).join("\n") || "None"}

🎯 ACTION ITEMS
${(result.actionItems || [])
        .map((a) => `• ${a.task} — ${a.assignee || "Unassigned"} (Due: ${a.deadline || "N/A"})`)
        .join("\n") || "None"}

❓ PENDING QUESTIONS
${(result.pendingQuestions || []).map((q) => `• ${q}`).join("\n") || "None"}
    `.trim();
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const copySection = (text) => {
    navigator.clipboard.writeText(text);
    alert("Section copied!");
  };

  return (
    <div className="container">
      <header>
        <h1>📝 AI Meeting Notes Extractor</h1>
        <p>Paste your meeting notes → Get structured action items</p>
      </header>

      <div className="input-box">
        <textarea
          placeholder="Paste meeting notes or transcript here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
        />
        <div className="btn-row">
          <button onClick={handleExtract} disabled={loading}>
            {loading ? "Extracting..." : "✨ Extract Info"}
          </button>
          <button className="secondary" onClick={() => { setNotes(""); setResult(null); setError(""); }}>
            Clear
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      {result && (
        <>
          <button className="copy-all" onClick={copyAll}>
            📋 Copy All Results
          </button>

          <Section
            title="📌 Discussion Points"
            items={result.discussionPoints}
            onCopy={copySection}
          />
          <Section
            title="✅ Decisions Made"
            items={result.decisions}
            onCopy={copySection}
          />
          <Section
            title="🎯 Action Items"
            items={(result.actionItems || []).map(
              (a) => `${a.task} — ${a.assignee || "Unassigned"} (Due: ${a.deadline || "N/A"})`
            )}
            onCopy={copySection}
          />
          <Section
            title="❓ Pending Questions"
            items={result.pendingQuestions}
            onCopy={copySection}
          />
        </>
      )}
    </div>
  );
}

function Section({ title, items, onCopy }) {
  if (!items || items.length === 0) {
    return (
      <div className="section empty">
        <h2>{title}</h2>
        <p className="muted">None detected</p>
      </div>
    );
  }
  return (
    <div className="section">
      <div className="section-header">
        <h2>{title}</h2>
        <button className="copy-btn" onClick={() => onCopy(items.join("\n"))}>
          Copy
        </button>
      </div>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}