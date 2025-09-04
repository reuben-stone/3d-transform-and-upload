import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Scene from "./Scene";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:3000";

function App() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files?.[0] || null);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select an OBJ file.");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".obj")) {
            toast.error("Invalid file type. Please upload a .obj file.");
            return;
        }

        setLoading(true);
        setFileUrl("");

        const formData = new FormData();
        formData.append("model", file);

        try {
            const response = await axios.post(`${API_URL}/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setFileUrl(response.data.fileUrl);
            toast.success("Upload successful!");
        } catch (err) {
            const message =
                err.response?.data?.error || "Upload failed. Please try again.";
            toast.error(message);
            console.error("Upload error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="uploadWidget">
                <label htmlFor="fileUpload" className="fileLabel">
                    Select file
                </label>
                <input
                    id="fileUpload"
                    type="file"
                    accept=".obj"
                    onChange={handleFileChange}
                    className="fileInput"
                />
                <button
                    className="btn upload"
                    onClick={handleUpload}
                    disabled={loading || !file}
                >
                    {loading ? "Uploading..." : "Upload"}
                </button>
                {file && !fileUrl && loading && (
                    <p className="fileName">Optimising and saving {file.name}...</p>
                )}
            </div>

            {loading && (
                <div className="spinnerOverlay" role="status" aria-live="polite">
                    <div className="spinner"></div>
                    <span className="sr-only">Uploading, please wait...</span>
                </div>
            )}

            {fileUrl && (
                <div className="downloadWidget">
                    <div className="copyUrlBlock">
                        <label htmlFor="downloadUrl" className="urlLabel">
                            Optimized Model URL:
                        </label>
                        <input
                            id="downloadUrl"
                            type="text"
                            readOnly
                            value={fileUrl}
                            className="downloadUrlInput"
                        />
                    </div>
                    <a
                        className="btn"
                        download
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Download
                    </a>
                </div>
            )}

            <div className="sceneWrapper">
                {fileUrl && <Scene modelUrl={fileUrl} />}
            </div>

            <ToastContainer />
        </div>
    );
}

export default App;