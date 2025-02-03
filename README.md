# 3D Object Transformation Pipeline

This project is a full-stack solution for processing 3D object files. It allows users to upload an `.obj` file, which is then converted to `.gltf`, optimized (by reducing polygon count and applying Draco compression), has its color palette automatically updated, and finally stored in Firebase Storage. The user interacts with a React-based front end built with Vite that provides a smooth experience with a loading spinner and displays a download URL and React Three Fiber Scene rendering their newly optimised model once processing is complete.

![Screnshot](screenshot.png?raw=true "Screenshot")

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Functionality and Process](#functionality-and-process)
- [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- **File Upload:**  
  - Accepts only `.obj` files.
- **Conversion and Optimization:**  
  - Converts `.obj` to `.gltf` using `obj2gltf`.
  - Optimizes the file using `gltf-pipeline` with Draco compression.
  - Adjusts color schemes and reduces polygon count.
- **Storage:**  
  - Saves the optimized `.glb` file to Firebase Storage with a unique, standardized filename.
- **User Interface:**  
  - Built with React and Vite.
  - Provides a file input, upload button, and a loading spinner.
  - Displays the public URL for the optimized file and a download button after processing.

## Project Structure

```
/3d-object-transform
├── /server                 # Node.js API
│   ├── /src
│   │   ├── optimizeModel.js  # Converts & optimizes 3D files
│   │   ├── storage.js        # Handles Firebase Storage uploads
│   │   ├── server.js         # Express API server
│   ├── .gitignore
│   ├── package.json
│   └── README.md           # (This file)
├── /client                 # React front-end (Vite-based)
│   ├── index.html          # HTML entry point for the React app
│   ├── package.json
│   ├── vite.config.js
│   └── /src
│       ├── main.jsx        # React entry file
│       ├── App.jsx         # Main React component
│       └── index.css       # CSS styles
├── firebaseConfig.js       # Firebase configuration for storage
└── README.md               # This file
```

## Functionality and Process

1. **User Upload:**
   - The user opens the front-end application.
   - They select an `.obj` file using the file input.
   - The file type is validated by the front end.

2. **Backend Processing:**
   - The selected file is sent via a POST request to the Express API.
   - The API verifies that the file is an `.obj`.
   - **Conversion:** The file is converted from `.obj` to `.gltf` using `obj2gltf`.
   - **Optimization:**  
     - The converted file is optimized using `gltf-pipeline` with Draco compression.
     - Polygon reduction using `meshoptimizer`. 
     - Automated random color palette adjustment.
   - The optimized file is saved as a `.glb`.

3. **Storage:**
   - The optimized `.glb` file is uploaded to Firebase Storage.
   - A unique filename (e.g., `optimized-<timestamp>.glb`) is generated.
   - The file is made public and a URL is generated.

4. **User Feedback:**
   - The API returns the public URL to the front end.
   - The React app displays a loading spinner during processing and shows the download URL once complete.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+ recommended)
- A Firebase account with Storage enabled
- npm (comes with Node.js)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd server
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Place your Firebase web service config variables in a new .env file in server root see (/server/env.example for required vars). 

4. Start the backend server:
   ```bash
   node src/server.js
   ```
   The API will be available at `http://localhost:3000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd client
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The front end will be available at the URL provided by Vite (typically `http://localhost:5173`).

## Usage

1. Open the front-end URL in your browser.
2. Use the file input to select an `.obj` file.
3. Click the "Upload" button.
4. A loading spinner appears while the file is being processed.
5. Once processing is complete, the optimized file's public URL is displayed.
6. Click the URL to access or download your optimized 3D model.

## Deployment

- **Backend:**  
  Deploy on platforms like Heroku, DigitalOcean, or using Docker.
  
- **Frontend:**  
  Deploy on Vercel, Netlify, or Firebase Hosting.
  
- **Firebase Storage:**  
  Ensure your Firebase Storage rules allow public access (or use signed URLs) for the optimized files.