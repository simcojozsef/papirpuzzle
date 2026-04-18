import { useState } from "react";
import axios from "axios";
import "./App.css";
import logo from "./assets/puzz.png";
import toast, { Toaster } from "react-hot-toast";
import { jsPDF } from "jspdf";
import { FaAngleDown } from "react-icons/fa";

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState("");

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const downloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF();

    const lines = doc.splitTextToSize(result, 180); // tördelés
    doc.text(lines, 10, 10);

    doc.save("reconstructed.pdf");
  };

  const upload = async () => {
    if (!files.length) {
      toast.error("Kérjük válassz ki legalább egy PDF fájlt!");
      return;
    }

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      setLoading(true);
      setResult("");
      setProgress(0);

      const res = await axios.post(
        //"http://127.0.0.1:8000/api/upload",
        "https://papirpuzzle.onrender.com/reconstruct/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              setProgress(percent);
            }
          },
        }
      );

      setResult(res.data.combined_text || "No result returned");
      toast.success("Rekonstrukció kész!");

    } catch (err) {
      console.error(err);
      toast.error("Hiba történt a feltöltés során");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Toaster position="top-right" />
    <div style={styles.container}>
      <div style={styles.header}>
        <img src={logo} alt="PapírPuzzle logo" style={styles.logo} />
        <h1 style={styles.title}>Papír Puzzle</h1>
      </div>
      <p style={styles.subtitle}>
        Véletlenül iratmegsemmisítőbe kerültek a fontos dokumentumaid? Ne aggódj, a Papír Puzzle segít újra összeilleszteni őket! Csak töltsd fel a darabokat, és hagyd, hogy a mesterséges intelligencia elvégezze a varázslatot.
      </p>

      {/* Upload */}
      <div style={styles.card}>
        <div style={styles.actions}>
          <label style={styles.uploadBox}>
            📎 Fájlok kiválasztása
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              style={styles.hiddenInput}
            />
          </label>

          <button
            onClick={upload}
            disabled={loading}
            style={styles.button}
          >
            {loading
            ? "Egy kis türelmet..."
            : result
            ? "Kész is vagyunk!"
            : "Rekonstrukció"}
          </button>
        </div>

        <p style={styles.helperText}>
          Töltsd fel a PDF fájlokat, és egy kattintással indítsd el a rekonstrukciót.
        </p>

        {/* Progress */}
        {loading && (
          <div style={styles.progressBox}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            <span>{progress}%</span>
          </div>
        )}
      </div>

      {/* Selected files */}
      {files.length > 0 && (
        <div style={styles.card}>
          <h3>📂 Feltöltött dokumentumok ({files.length})</h3>
          <ul style={styles.fileList}>
            {Array.from(files).map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={styles.resultBox}>
          <h3>📄 Rekonstruált dokumentum</h3>
          <div style={styles.resultText}>{result}</div>

          <button onClick={downloadPDF} style={styles.downloadButton}>
            <FaAngleDown style={{ marginRight: "6px" }} />
            PDF letöltése
          </button>
        </div>
      )}
    </div>
    </>
  );
}

const styles = {
  helperText: {
    fontSize: "14px",
    color: "#94a3b8",
    marginTop: "16px",
    textAlign: "center",
  },
  downloadButton: {
    marginTop: "15px",
    padding: "10px 16px",
    background: "var(--cta)",
    border: "none",
    borderRadius: "8px",
    color: "#0b1220",
    fontWeight: "600",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    height: "20px",
    marginRight: "6px",
    display: "flex",
    alignItems: "center",
  },
  actions: {
    display: "flex",
    gap: "5px",
  },
  uploadBox: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "44px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.03)",
    border: "1px dashed rgba(255,255,255,0.2)",
    color: "#cbd5f5",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  hiddenInput: {
    display: "none",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },

  logo: {
    width: "70px",
    height: "70px",
    objectFit: "contain",
  },
  container: {
    padding: "40px",
    maxWidth: "900px",
    margin: "0 auto",
  },

  title: {
    fontFamily: "Inter, sans-serif",
    fontSize: "38px",
    fontWeight: "600",
    letterSpacing: "-0.5px",
    color: "white",
  },

  subtitle: {
    color: "#94a3b8",
    marginBottom: "20px",
  },

  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    backdropFilter: "blur(6px)",
  },

  button: {
    flex: 1,
    height: "44px",
    background: "var(--cta)",
    border: "none",
    borderRadius: "8px",
    color: "#0b1220",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  progressBox: {
    marginTop: "15px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "8px",
    overflow: "hidden",
    position: "relative",
    height: "20px",
  },

  progressBar: {
    height: "100%",
    background: "var(--cta)",
    transition: "width 0.2s ease",
  },

  fileList: {
    marginTop: "10px",
    color: "#cbd5f5",
    listStyle: "none",
  },

  resultBox: {
    background: "#020617",
    border: "1px solid rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "12px",
    maxHeight: "1200px",
    overflowY: "auto",
  },

  resultText: {
    whiteSpace: "pre-wrap",
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#e2e8f0",
  },
};

export default App;