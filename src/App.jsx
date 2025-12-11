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
    
    // Count indicators for each room type with weighted scoring
    const kitchenIndicators = {
      strong: ['oven', 'microwave', 'refrigerator', 'stove', 'dishwasher'], // 3 points each
      medium: ['toaster', 'kettle', 'pot', 'pan', 'sink'] // 1 point each
    };
    const bathroomIndicators = {
      strong: ['toilet', 'bathtub', 'shower'], // 5 points each
      medium: ['towel', 'bathroom accessories'] // 1 point each
    };
    const bedroomIndicators = {
      strong: ['bed'], // 5 points
      medium: ['pillow', 'blanket', 'nightstand', 'dresser'] // 1 point each
    };
    const livingRoomIndicators = {
      strong: ['couch', 'sofa'], // 3 points each
      medium: ['tv', 'remote', 'coffee table'] // 1 point each
    };
    const diningRoomIndicators = {
      strong: ['dining table'], // 5 points
      medium: ['chair'] // 1 point
    };
    
    // Calculate weighted scores
    let kitchenScore = 0;
    let bathroomScore = 0;
    let bedroomScore = 0;
    let livingRoomScore = 0;
    let diningRoomScore = 0;
    
    classes.forEach(c => {
      // Kitchen scoring
      if (kitchenIndicators.strong.includes(c)) kitchenScore += 3;
      else if (kitchenIndicators.medium.includes(c)) kitchenScore += 1;
      
      // Bathroom scoring
      if (bathroomIndicators.strong.includes(c)) bathroomScore += 5;
      else if (bathroomIndicators.medium.includes(c)) bathroomScore += 1;
      
      // Bedroom scoring
      if (bedroomIndicators.strong.includes(c)) bedroomScore += 5;
      else if (bedroomIndicators.medium.includes(c)) bedroomScore += 1;
      
      // Living room scoring
      if (livingRoomIndicators.strong.includes(c)) livingRoomScore += 3;
      else if (livingRoomIndicators.medium.includes(c)) livingRoomScore += 1;
      
      // Dining room scoring
      if (diningRoomIndicators.strong.includes(c)) diningRoomScore += 5;
      else if (diningRoomIndicators.medium.includes(c)) diningRoomScore += 1;
    });
    
    // Find highest scoring room type (minimum score of 2 required)
    const scores = [
      { type: 'bathroom', score: bathroomScore },
      { type: 'kitchen', score: kitchenScore },
      { type: 'bedroom', score: bedroomScore },
      { type: 'living room', score: livingRoomScore },
      { type: 'dining room', score: diningRoomScore }
    ];
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    // Return highest scoring room if it meets minimum threshold
    if (scores[0].score >= 2) {
      return scores[0].type;
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
      'flower', 'plant', 'flowers', 'bouquet',
      
      // Additional clutter
      'wire', 'cable', 'cord', 'charger', 'adapter',
      'trash', 'garbage', 'waste', 'recycling',
      'cleaning', 'supplies', 'mop', 'broom', 'vacuum',
      'tool', 'tools', 'toolbox',
      'clothing', 'laundry', 'clothes',
      'rug', 'mat', 'carpet',
      'sign', 'sticker', 'label',
      'package', 'packaging', 'wrapping'
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
      
      // If it matches a known easy-to-remove item, return it with detailed reason
      if (easyToRemoveItems.some(item => 
        name.includes(item) || item.includes(name)
      )) {
        let reason = '';
        
        // Provide specific reasons based on item type
        if (['person', 'dog', 'cat', 'bird'].some(p => name.includes(p))) {
          reason = 'Buyers focus on the space, not current occupants';
        } else if (['bottle', 'cup', 'bowl', 'plate', 'dish', 'glass', 'mug', 'fork', 'knife', 'spoon'].some(i => name.includes(i))) {
          reason = 'Clear surfaces make kitchens look spacious and clean';
        } else if (['towel', 'toothbrush', 'soap', 'shampoo', 'lotion', 'makeup', 'cosmetics'].some(i => name.includes(i))) {
          reason = 'Bathrooms should look spa-like and depersonalized';
        } else if (['pillow', 'blanket', 'sheet', 'clothes', 'jacket', 'shirt', 'pants', 'shoes'].some(i => name.includes(i))) {
          reason = 'Bedrooms need minimal styling - less is more';
        } else if (['laptop', 'phone', 'remote', 'keyboard', 'mouse', 'headphones'].some(i => name.includes(i))) {
          reason = 'Electronics create visual clutter and distraction';
        } else if (['book', 'paper', 'magazine', 'document', 'mail'].some(i => name.includes(i))) {
          reason = 'Paper clutter makes spaces look busy and disorganized';
        } else if (['toy', 'teddy bear', 'doll', 'game'].some(i => name.includes(i))) {
          reason = 'Toys distract from the home\'s features';
        } else if (['photo', 'picture', 'artwork', 'poster'].some(i => name.includes(i))) {
          reason = 'Personal photos should be removed for neutral appeal';
        } else {
          reason = 'Creates visual clutter - clear for photos';
        }
        
        return {
          name: className,
          confidence: '100',
          location: `${(bbox[0]).toFixed(0)}, ${(bbox[1]).toFixed(0)}`,
          type: 'specific',
          reason: reason
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
    
    // Add professional styling tips for each confidently identified room
    if (roomType === 'kitchen' && objects.some(obj => ['oven', 'microwave', 'refrigerator'].includes(obj.class.toLowerCase()))) {
      generalRecommendations.push({
        name: '✨ Kitchen Styling Tips',
        confidence: '100',
        location: 'Kitchen',
        type: 'styling',
        tips: [
          'Clear ALL items from countertops - show maximum counter space',
          'Remove magnets, papers, and photos from refrigerator',
          'Hide dish soap, sponges, and cleaning supplies',
          'Put away small appliances (toaster, coffee maker, mixer)',
          'Stage with a single bowl of fresh fruit or flowers',
          'Ensure all cabinet doors are closed',
          'Polish stainless steel appliances',
          'Turn on under-cabinet lighting for warm ambiance'
        ]
      });
    } else if (roomType === 'bathroom' && objects.some(obj => ['toilet'].includes(obj.class.toLowerCase()))) {
      generalRecommendations.push({
        name: '✨ Bathroom Styling Tips',
        confidence: '100',
        location: 'Bathroom',
        type: 'styling',
        tips: [
          'Remove ALL toiletries from counters and shower',
          'Hide toothbrushes, soap, shampoo bottles',
          'Remove bath mats and personal towels',
          'Close toilet lid and shower curtain',
          'Stage with 2-3 white fluffy towels, neatly folded',
          'Add a small plant or candle for spa feel',
          'Clean mirrors and fixtures until spotless',
          'Ensure good lighting - turn on all lights'
        ]
      });
    } else if (roomType === 'bedroom' && objects.some(obj => ['bed'].includes(obj.class.toLowerCase()))) {
      generalRecommendations.push({
        name: '✨ Bedroom Styling Tips',
        confidence: '100',
        location: 'Bedroom',
        type: 'styling',
        tips: [
          'Make bed with crisp, neutral linens',
          'Remove ALL personal items from nightstands',
          'Limit pillows to 4-6 decorative ones maximum',
          'Clear dresser tops completely',
          'Hide clothes, shoes, and personal belongings',
          'Close closet doors (or style if walk-in)',
          'Add symmetry with matching lamps',
          'Keep floor clear - creates spacious feel'
        ]
      });
    } else if (roomType === 'living room' && objects.some(obj => ['couch', 'sofa', 'tv'].includes(obj.class.toLowerCase()))) {
      generalRecommendations.push({
        name: '✨ Living Room Styling Tips',
        confidence: '100',
        location: 'Living room',
        type: 'styling',
        tips: [
          'Clear coffee table except 1-2 styled items',
          'Limit throw pillows to 3-4 per sofa',
          'Remove excess blankets and personal items',
          'Hide remotes, cables, and electronics',
          'Arrange furniture to show flow and space',
          'Add fresh flowers or greenery',
          'Ensure adequate lighting - multiple sources',
          'Create conversational seating arrangement'
        ]
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
