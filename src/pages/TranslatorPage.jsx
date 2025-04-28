import React, { useState } from "react";

const languages = [
  { code: "auto", name: "🌐 Auto Detect" },
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ru", name: "Russian" },
];

export default function TranslatorPage() {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [loading, setLoading] = useState(false);

  async function handleTranslate() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang === "auto" ? "auto" : sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await response.json();
      
      if (data && data[0]) {
        const translatedText = data[0]
          .map((item) => item[0])
          .filter(Boolean)
          .join("");
        setTranslatedText(translatedText);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedText("Error translating. Please try again.");
    }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(translatedText);
    alert("Copied to clipboard!");
  }

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <h1 className="mb-4 text-center">🌍 In-App Translator (Auto-Detect)</h1>

      <div className="mb-3">
        <label className="form-label">Enter text:</label>
        <textarea
          className="form-control"
          rows="4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something to translate..."
        />
      </div>

      <div className="row mb-4">
        <div className="col">
          <label className="form-label">From:</label>
          <select
            className="form-select"
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col">
          <label className="form-label">To:</label>
          <select
            className="form-select"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          >
            {languages.filter((lang) => lang.code !== "auto").map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="d-grid">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleTranslate}
          disabled={loading}
        >
          {loading ? "Translating..." : "Translate"}
        </button>
      </div>

      {translatedText && (
        <div className="mt-5">
          <h4>Translated Text:</h4>
          <div className="alert alert-success d-flex justify-content-between align-items-center">
            <span>{translatedText}</span>
            <button className="btn btn-sm btn-outline-secondary ms-2" onClick={handleCopy}>
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 