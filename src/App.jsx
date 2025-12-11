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
    
    // Count indicators for each room type for better confidence
    const kitchenIndicators = ['oven', 'microwave', 'refrigerator', 'stove', 'dishwasher', 'toaster'];
    const bathroomIndicators = ['toilet', 'bathtub', 'shower'];
    const bedroomIndicators = ['bed'];
    const livingRoomIndicators = ['couch', 'sofa', 'tv'];
    const diningRoomIndicators = ['dining table'];
    
    const kitchenScore = classes.filter(c => kitchenIndicators.includes(c)).length;
    const bathroomScore = classes.filter(c => bathroomIndicators.includes(c)).length;
    const bedroomScore = classes.filter(c => bedroomIndicators.includes(c)).length;
    const livingRoomScore = classes.filter(c => livingRoomIndicators.includes(c)).length;
    const diningRoomScore = classes.filter(c => diningRoomIndicators.includes(c)).length;
    
    // Strong bathroom detection (toilet is unique to bathrooms)
    if (bathroomScore > 0) {
      return 'bathroom';
    }
    
    // Kitchen detection (needs at least 1 strong indicator)
    if (kitchenScore > 0) {
      return 'kitchen';
    }
    
    // Bedroom detection
    if (bedroomScore > 0) {
      return 'bedroom';
    }
    
    // Living room detection
    if (livingRoomScore > 0) {
      return 'living room';
    }
    
    // Dining room detection
    if (diningRoomScore > 0) {
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
      'backpack', 'handbag', 'suitcase', 'umbrella', 'tie', 'bag', 'purse', 'wallet', 'jacket', 'coat', 'sweater', 'shirt', 'pants', 'shoes',
      
      // Electronics & devices (small, movable)
      'cell phone', 'remote', 'laptop', 'keyboard', 'mouse', 'monitor', 'phone', 'tablet', 'ipad', 'computer', 'headphones', 'speaker', 'camera',
      
      // Kitchen clutter (on counters/tables) - dishes, cutlery, cups
      'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'pot', 'pan',
      'plate', 'dish', 'glass', 'mug', 'utensil', 'cutlery', 'silverware', 'dinnerware',
      'drinking glass', 'coffee cup', 'tea cup', 'saucer', 'platter', 'pitcher', 'kettle',
      'container', 'jar', 'lid', 'cap', 'sauce', 'condiment', 'spice', 'seasoning',
      
      // Food items (should not be visible)
      'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
      'food', 'fruit', 'vegetable', 'meat', 'bread', 'cheese', 'milk', 'drink',
      
      // Sports equipment (easily movable)
      'sports ball', 'baseball bat', 'tennis racket', 'frisbee', 'skateboard', 'surfboard', 'skis', 'snowboard',
      'bicycle', 'bike', 'weights', 'dumbbell', 'yoga mat', 'exercise ball',
      
      // Toys and small items
      'teddy bear', 'kite', 'toy', 'doll', 'game', 'puzzle', 'lego',
      
      // Bathroom items (toiletries, towels, personal care)
      'toothbrush', 'toothpaste', 'shampoo', 'soap', 'lotion', 'cosmetics',
      'towel', 'face washer', 'washcloth', 'bath mat', 'shower curtain', 'bathroom mat',
      'hair drier', 'hair dryer', 'brush', 'comb', 'razor', 'perfume', 'cologne',
      'tissue', 'tissue box', 'cotton', 'makeup', 'deodorant', 'medicine', 'vitamins',
      'bathroom accessories', 'toiletries', 'bath products', 'shower gel', 'body wash', 'moisturizer',
      
      // Bedroom items
      'pillow', 'blanket', 'sheet', 'comforter', 'bedspread', 'duvet', 'mattress', 'pillow case',
      'nightstand', 'dresser', 'closet', 'wardrobe', 'hanger', 'shoe rack',
      
      // Living room items
      'cushion', 'throw pillow', 'throw blanket', 'couch throw', 'ottoman', 'footstool',
      
      // General clutter
      'scissors', 'pen', 'pencil', 'paper', 'document', 'mail', 'magazine',
      'book', 'notebook', 'clipboard', 'folder', 'binder',
      'box', 'container', 'basket', 'bag', 'pouch', 'case',
      'picture', 'photo', 'poster', 'artwork', 'frame',
      'candle', 'decoration', 'ornament', 'figurine', 'statue',
      'flower', 'plant', 'flowers', 'bouquet'
    ];
    
    // Items to EXCLUDE (large furniture that should stay)
    const furnitureToKeep = [
      'chair', 'couch', 'bed', 'dining table', 'toilet', 'tv', 'sink', 'oven', 'refrigerator',
      'microwave', 'bench', 'potted plant', 'clock', 'vase', 'wall', 'door', 'window', 'ceiling',
      'floor', 'curtain', 'lamp', 'light', 'table'
    ];

    // Categorize unidentified objects by room and position
    const categorizeClutter = (className, roomType, bbox) => {
      const name = className.toLowerCase();
      
      // Check if it's furniture we should keep
      if (furnitureToKeep.some(furniture => 
        name.includes(furniture) || furniture.includes(name)
      )) {
        return null;
      }
      
      // If it matches a known easy-to-remove item, return it as-is
      if (easyToRemoveItems.some(item => 
        name.includes(item) || item.includes(name)
      )) {
        return {
          name: className,
          confidence: '100',
          location: `${(bbox[0]).toFixed(0)}, ${(bbox[1]).toFixed(0)}`,
          type: 'specific'
        };
      }
      
      // For unidentified objects, categorize by room context
      // Kitchen: likely dishes, bottles, food containers
      if (roomType === 'kitchen') {
        return {
          name: 'Kitchen clutter',
          confidence: '85',
          location: `${(bbox[0]).toFixed(0)}, ${(bbox[1]).toFixed(0)}`,
          type: 'categorized',
          category: 'Dishes, bottles, or items on surfaces'
        };
      }
      
      // Bathroom: likely toiletries, bottles, products
      if (roomType === 'bathroom') {
        return {
          name: 'Bathroom items',
          confidence: '85',
          location: `${(bbox[0]).toFixed(0)}, ${(bbox[1]).toFixed(0)}`,
          type: 'categorized',
          category: 'Toiletries, bottles, or personal items'
        };
      }
      
      // Bedroom: likely clothes, pillows, items on surfaces
      if (roomType === 'bedroom') {
        return {
          name: 'Bedroom clutter',
          confidence: '85',
          location: `${(bbox[0]).toFixed(0)}, ${(bbox[1]).toFixed(0)}`,
          type: 'categorized',
          category: 'Clothes, items on surfaces, or personal belongings'
        };
      }
      
      // Living room/general: likely decorative items, books, remotes
      return {
        name: 'Visible clutter',
        confidence: '85',
        location: `${(bbox[0]).toFixed(0)}, ${(bbox[1]).toFixed(0)}`,
        type: 'categorized',
        category: 'Remove this object'
      };
    };

    const specificItems = objects
      .map(obj => categorizeClutter(obj.class, roomType, obj.bbox))
      .filter(item => item !== null);

    // Only show contextual advice for confidently identified rooms
    const generalRecommendations = [];
    
    // Only add room-specific advice if we're confident about the room type
    if (roomType === 'kitchen' && objects.some(obj => ['oven', 'microwave', 'refrigerator'].includes(obj.class.toLowerCase()))) {
      generalRecommendations.push({
        name: 'Clear all items off countertops',
        confidence: '95',
        location: 'Kitchen surfaces',
        type: 'general'
      });
    } else if (roomType === 'bathroom' && objects.some(obj => ['toilet'].includes(obj.class.toLowerCase()))) {
      generalRecommendations.push({
        name: 'Clear toiletries from countertops',
        confidence: '95',
        location: 'Bathroom counter',
        type: 'general'
      });
    } else if (roomType === 'bedroom' && objects.some(obj => ['bed'].includes(obj.class.toLowerCase()))) {
      generalRecommendations.push({
        name: 'Clear nightstand and dresser surfaces',
        confidence: '95',
        location: 'Bedroom surfaces',
        type: 'general'
      });
    } else if (roomType === 'living room' && objects.some(obj => ['couch', 'sofa', 'tv'].includes(obj.class.toLowerCase()))) {
      generalRecommendations.push({
        name: 'Clear coffee table and side surfaces',
        confidence: '95',
        location: 'Living room surfaces',
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
