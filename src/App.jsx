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
          <div className="logo">PP</div>
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
