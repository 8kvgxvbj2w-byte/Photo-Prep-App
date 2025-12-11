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
    // Filter for easily movable items, excluding large furniture
    const recommendations = filterForRemoval(objects);
    setRemovalRecommendations(recommendations);
  };

  const filterForRemoval = (objects) => {
    // ONLY easily movable clutter - exclude large furniture
    const easyToRemoveItems = [
      // People and pets (always remove)
      'person', 'dog', 'cat', 'bird',
      
      // Personal belongings & clutter
      'backpack', 'handbag', 'suitcase', 'umbrella', 'tie',
      
      // Electronics & devices (small, movable)
      'cell phone', 'remote', 'laptop', 'keyboard', 'mouse',
      
      // Kitchen clutter (on counters/tables)
      'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
      
      // Food items (should not be visible)
      'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
      
      // Sports equipment (easily movable)
      'sports ball', 'baseball bat', 'tennis racket', 'frisbee', 'skateboard', 'surfboard', 'skis', 'snowboard',
      
      // Toys and small items
      'teddy bear', 'kite', 'toy',
      
      // Small personal care items
      'scissors', 'hair drier', 'toothbrush',
      
      // Books and papers
      'book'
    ];
    
    // Items to EXCLUDE (large furniture that should stay)
    const furnitureToKeep = [
      'chair', 'couch', 'bed', 'dining table', 'toilet', 'tv', 'sink', 'oven', 'refrigerator',
      'microwave', 'bench', 'potted plant', 'clock', 'vase'
    ];

    return objects
      .filter(obj => {
        const className = obj.class.toLowerCase();
        
        // Skip if it's furniture
        if (furnitureToKeep.some(furniture => 
          className.includes(furniture) || furniture.includes(className)
        )) {
          return false;
        }
        
        // Include if it's easy to remove
        return easyToRemoveItems.some(item => 
          className.includes(item) || item.includes(className)
        );
      })
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
          <svg className="logo" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ppGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            {/* Left P */}
            <g>
              <rect x="12" y="12" width="12" height="56" fill="url(#ppGrad)" rx="2" />
              <ellipse cx="26" cy="28" rx="14" ry="12" fill="url(#ppGrad)" />
            </g>
            {/* Right P (overlapping) */}
            <g opacity="0.85">
              <rect x="40" y="12" width="12" height="56" fill="url(#ppGrad)" rx="2" />
              <ellipse cx="54" cy="28" rx="14" ry="12" fill="url(#ppGrad)" />
            </g>
            {/* Fusion circle in middle */}
            <circle cx="40" cy="35" r="10" fill="url(#ppGrad)" opacity="0.5" />
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
