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
    
    // Detect room type based on objects
    const roomType = detectRoomType(objects);
    
    // Filter for easily movable items, excluding large furniture
    const recommendations = filterForRemoval(objects, roomType);
    setRemovalRecommendations(recommendations);
  };

  const detectRoomType = (objects) => {
    const classes = objects.map(obj => obj.class.toLowerCase());
    
    // Kitchen indicators
    if (classes.some(c => ['oven', 'microwave', 'refrigerator', 'sink', 'toaster'].includes(c))) {
      return 'kitchen';
    }
    
    // Bathroom indicators
    if (classes.some(c => ['toilet', 'sink'].includes(c)) && 
        !classes.some(c => ['oven', 'refrigerator'].includes(c))) {
      return 'bathroom';
    }
    
    // Bedroom indicators
    if (classes.some(c => ['bed'].includes(c))) {
      return 'bedroom';
    }
    
    // Living room indicators
    if (classes.some(c => ['couch', 'tv', 'remote'].includes(c))) {
      return 'living room';
    }
    
    // Dining room indicators
    if (classes.some(c => ['dining table'].includes(c))) {
      return 'dining room';
    }
    
    return 'general';
  };

  const filterForRemoval = (objects, roomType) => {
    // ONLY easily movable clutter - exclude large furniture
    const easyToRemoveItems = [
      // People and pets (always remove)
      'person', 'dog', 'cat', 'bird',
      
      // Personal belongings & clutter
      'backpack', 'handbag', 'suitcase', 'umbrella', 'tie',
      
      // Electronics & devices (small, movable)
      'cell phone', 'remote', 'laptop', 'keyboard', 'mouse',
      
      // Kitchen clutter (on counters/tables) - dishes, cutlery, cups
      'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
      'plate', 'dish', 'glass', 'mug', 'utensil', 'cutlery', 'silverware',
      'drinking glass', 'coffee cup', 'tea cup', 'saucer', 'platter',
      
      // Food items (should not be visible)
      'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
      
      // Sports equipment (easily movable)
      'sports ball', 'baseball bat', 'tennis racket', 'frisbee', 'skateboard', 'surfboard', 'skis', 'snowboard',
      
      // Toys and small items
      'teddy bear', 'kite', 'toy',
      
      // Bathroom items (toiletries, towels, personal care)
      'toothbrush', 'toothpaste', 'shampoo', 'soap', 'lotion', 'cosmetics',
      'towel', 'face washer', 'washcloth', 'bath mat', 'shower curtain',
      'hair drier', 'hair dryer', 'brush', 'comb', 'razor', 'perfume',
      'tissue', 'tissue box', 'cotton', 'makeup', 'deodorant', 'medicine',
      'bathroom accessories', 'toiletries', 'bath products', 'shower gel',
      
      // Small personal care items
      'scissors',
      
      // Books and papers
      'book'
    ];
    
    // Items to EXCLUDE (large furniture that should stay)
    const furnitureToKeep = [
      'chair', 'couch', 'bed', 'dining table', 'toilet', 'tv', 'sink', 'oven', 'refrigerator',
      'microwave', 'bench', 'potted plant', 'clock', 'vase'
    ];

    const specificItems = objects
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
        location: `${(obj.bbox[0]).toFixed(0)}, ${(obj.bbox[1]).toFixed(0)}`,
        type: 'specific'
      }));

    // Add contextual general recommendations based on room type
    const generalRecommendations = [];
    
    if (roomType === 'kitchen') {
      generalRecommendations.push({
        name: 'Clear all items off countertops',
        confidence: '100',
        location: 'Kitchen surfaces',
        type: 'general'
      });
      generalRecommendations.push({
        name: 'Remove magnets and papers from refrigerator',
        confidence: '100',
        location: 'Refrigerator',
        type: 'general'
      });
    } else if (roomType === 'bathroom') {
      generalRecommendations.push({
        name: 'Clear toiletries from countertops',
        confidence: '100',
        location: 'Bathroom counter',
        type: 'general'
      });
      generalRecommendations.push({
        name: 'Remove bath mats and towels',
        confidence: '100',
        location: 'Bathroom floor',
        type: 'general'
      });
    } else if (roomType === 'bedroom') {
      generalRecommendations.push({
        name: 'Clear nightstand clutter',
        confidence: '100',
        location: 'Nightstand',
        type: 'general'
      });
      generalRecommendations.push({
        name: 'Remove personal items from dresser',
        confidence: '100',
        location: 'Dresser top',
        type: 'general'
      });
    } else if (roomType === 'living room') {
      generalRecommendations.push({
        name: 'Clear coffee table surface',
        confidence: '100',
        location: 'Coffee table',
        type: 'general'
      });
      generalRecommendations.push({
        name: 'Remove excess throw pillows and blankets',
        confidence: '100',
        location: 'Seating area',
        type: 'general'
      });
    }
    
    // Always add general clutter advice if room has any objects
    if (objects.length > 0) {
      generalRecommendations.push({
        name: 'Remove visible clutter and personal items',
        confidence: '100',
        location: 'Throughout space',
        type: 'general'
      });
    }

    return [...specificItems, ...generalRecommendations];
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
