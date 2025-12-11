import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import ObjectDetector from './components/ObjectDetector';
import RemovalList from './components/RemovalList';
import './App.css';

function App() {
  const [cameraImage, setCameraImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [removalRecommendations, setRemovalRecommendations] = useState([]);

  const handleCapture = (imageSrc) => {
    setCameraImage(imageSrc);
    setDetectedObjects([]);
    setRemovalRecommendations([]);
  };

  const handleDetectionComplete = (objects) => {
    setDetectedObjects(objects);
    const recommendations = filterForRemoval(objects);
    setRemovalRecommendations(recommendations);
  };

  const filterForRemoval = (objects) => {
    // List of objects that should be removed for real estate photos
    const removalList = [
      'person', 'dog', 'cat', 'toy', 'teddy bear', 'bicycle', 'skateboard',
      'car', 'motorcycle', 'sports equipment', 'clutter', 'trash', 'shoes',
      'backpack', 'luggage', 'tools', 'ladder', 'paint brush', 'bucket'
    ];

    return objects
      .filter(obj => removalList.some(item => 
        obj.class.toLowerCase().includes(item) || 
        item.includes(obj.class.toLowerCase())
      ))
      .map(obj => ({
        name: obj.class,
        confidence: (obj.score * 100).toFixed(1),
        location: `${(obj.bbox[0]).toFixed(0)}, ${(obj.bbox[1]).toFixed(0)}`
      }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-container">
          <svg className="logo" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            {/* Fused PP Logo */}
            <defs>
              <linearGradient id="ppGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#2563eb', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#1d4ed8', stopOpacity: 1}} />
              </linearGradient>
            </defs>
            {/* First P */}
            <path d="M 12 8 L 12 52 L 22 52 L 22 32 L 28 32 Q 35 32 35 24 Q 35 16 28 16 L 22 16 L 22 8 Z M 22 24 L 28 24 Q 30 24 30 24 Q 30 24 28 24 L 22 24 Z" 
                  fill="url(#ppGradient)" />
            {/* Second P (overlapping/fused) */}
            <path d="M 32 8 L 32 52 L 42 52 L 42 32 L 48 32 Q 55 32 55 24 Q 55 16 48 16 L 42 16 L 42 8 Z M 42 24 L 48 24 Q 50 24 50 24 Q 50 24 48 24 L 42 24 Z" 
                  fill="url(#ppGradient)" opacity="0.9" />
            {/* Fusion element - connects the two P's */}
            <circle cx="30" cy="30" r="8" fill="url(#ppGradient)" opacity="0.6" />
          </svg>
          <h1>Photo Prep</h1>
        </div>
        <p>Real Estate Photo Assistant</p>
      </header>

      <main className="app-main">
        <div className="layout">
          <section className="camera-section">
            <CameraCapture onCapture={handleCapture} image={cameraImage} />
          </section>

          {cameraImage && (
            <>
              <section className="detection-section">
                <ObjectDetector 
                  image={cameraImage} 
                  onDetectionComplete={handleDetectionComplete}
                  detectedObjects={detectedObjects}
                />
              </section>

              <section className="results-section">
                <RemovalList 
                  recommendations={removalRecommendations}
                  totalDetected={detectedObjects.length}
                />
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
