import React, { useState } from 'react'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import Scene from './Scene'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')

  const handleFileChange = (e) => {
        setFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!file) {
        toast.error('Please select an OBJ file.')
        return
    }
    if (!file.name.toLowerCase().endsWith(".obj")) {
        toast.error("Invalid file type. Please upload a .obj file.");
        return;
    }
    setLoading(true)
    setFileUrl('')
    const formData = new FormData()
    formData.append('model', file)

    try {
        // Adjust the URL as needed to point to your backend API.
        const response = await axios.post('http://localhost:3000/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        setFileUrl(response.data.fileUrl)
        toast.success('Upload successful!')
    } catch (error) {
        console.log(error);
        toast.error('Upload failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="container">
    
        <div className="uploadWidget">
            {/* <h2>3D Object Uploader</h2> */}
            <label htmlFor="fileUpload" className="fileLabel">
                Select file
            </label>
            <input id="fileUpload" type="file" accept=".obj" onChange={handleFileChange} className="fileInput" />
            <button className="btn upload" onClick={handleUpload} disabled={loading || !file}>
                {loading ? "Uploading..." : "Upload"}
            </button>
            {file && !fileUrl && loading && <p className="fileName">Optimising and saving {file.name}...</p>}
        </div>

        {loading && (
            <div className="spinner-overlay">
                <div className="spinner"></div>
            </div>
        )}

        {fileUrl && (
            <div className="downloadWidget">
                <div className="copyUrlBlock">
                    <label htmlFor="fileUpload" className="urlLabel">
                        Optimized Model URL: 
                    </label>
                    <input type="text" readOnly value={fileUrl} className="downloadUrlInput" />
                </div>
                <a className="btn" download href={fileUrl} target="_blank" rel="noopener noreferrer">
                    Download
                </a>
            </div>
        )}

        <div className="sceneWrapper">
            {fileUrl && (<Scene modelUrl={fileUrl} />)}
        </div>
        <ToastContainer />
    </div>
  )
}

export default App
