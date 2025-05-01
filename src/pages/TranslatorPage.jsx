import React, { useState, useEffect } from "react";

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
  { code: "ne", name: "Nepali" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "pt", name: "Portuguese" },
  { code: "ar", name: "Arabic" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "it", name: "Italian" },
  { code: "pl", name: "Polish" },
  { code: "uk", name: "Ukrainian" },
  { code: "th", name: "Thai" },
  { code: "ms", name: "Malay" },
];

export default function TranslatorPage() {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }

    const timer = setTimeout(() => {
      handleTranslate();
    }, 500); // Wait 0.5 seconds after typing stops

    return () => clearTimeout(timer);
  }, [text, sourceLang, targetLang]);

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
    <div
      className="container py-5"
      style={{
        maxWidth: 800,
        background: 'linear-gradient(135deg, #4a90e2, #9b59b6, #ffa07a)',
        borderRadius: '15px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        color: 'white'
      }}
    >
      <h1 className="mb-4 text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>🌍 In-App Translator (Auto-Detect)</h1>

      <div className="mb-3">
        <label className="form-label" style={{ color: 'white' }}>Enter text:</label>
        <textarea
          className="form-control"
          rows="4"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something to translate..."
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
        />
      </div>

      <div className="row mb-4">
        <div className="col">
          <label className="form-label" style={{ color: 'white' }}>From:</label>
          <select
            className="form-select"
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col">
          <label className="form-label" style={{ color: 'white' }}>To:</label>
          <select
            className="form-select"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
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
          style={{
            background: 'linear-gradient(45deg, #2196F3, #00BCD4)',
            border: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          {loading ? "Translating..." : "Translate"}
        </button>
      </div>

      {translatedText && (
        <div className="mt-5">
          <h4 style={{ color: 'white' }}>Translated Text:</h4>
          <div className="alert alert-success d-flex justify-content-between align-items-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <span style={{ color: '#333' }}>{translatedText}</span>
            <button
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={handleCopy}
              style={{ borderColor: '#4a90e2', color: '#4a90e2' }}
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 