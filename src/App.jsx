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
      'person', 'people', 'human', 'man', 'woman', 'child', 'kid', 'baby',
      'dog', 'cat', 'bird', 'pet', 'animal',
      
      // Personal belongings & clutter
      'backpack', 'handbag', 'suitcase', 'umbrella', 'tie', 'bag', 'purse', 'wallet', 'jacket', 'coat', 'sweater', 'shirt', 'pants', 'shoes',
      'briefcase', 'luggage', 'duffel bag', 'tote bag', 'shoulder bag', 'crossbody bag', 'messenger bag',
      'scarf', 'hat', 'cap', 'beanie', 'gloves', 'socks', 'underwear',
      'vest', 'hoodie', 'sweatshirt', 'cardigan', 'blazer', 'dress', 'skirt', 'shorts', 'jeans',
      'sneakers', 'boot', 'sandal', 'slipper', 'heel', 'loafer', 'flip flop',
      
      // Electronics & devices (small, movable)
      'cell phone', 'mobile phone', 'smartphone', 'iphone', 'android', 'remote', 'laptop', 'notebook',
      'keyboard', 'mouse', 'monitor', 'display', 'screen', 'phone', 'tablet', 'ipad', 'computer', 
      'desktop', 'workstation', 'headphones', 'earbuds', 'speaker', 'bluetooth speaker', 'camera',
      'webcam', 'printer', 'scanner', 'router', 'modem', 'charger', 'power bank', 'cable',
      'cord', 'wire', 'extension cord', 'power cord', 'adapter', 'hub', 'dock',
      
      // Kitchen clutter (on counters/tables) - dishes, cutlery, cups, cookware
      'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'pot', 'pan',
      'plate', 'dish', 'glass', 'mug', 'utensil', 'cutlery', 'silverware', 'dinnerware', 'flatware',
      'drinking glass', 'coffee cup', 'tea cup', 'saucer', 'platter', 'pitcher', 'kettle', 'teapot',
      'container', 'tupperware', 'jar', 'lid', 'cap', 'sauce', 'condiment', 'spice', 'seasoning',
      'baking tray', 'cookie sheet', 'cake pan', 'baking pan', 'mixing bowl', 'colander', 'strainer',
      'cutting board', 'knife block', 'spatula', 'wooden spoon', 'ladle', 'whisk', 'grater',
      'can opener', 'bottle opener', 'corkscrew', 'measuring cup', 'measuring spoon',
      
      // Food items (should not be visible)
      'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
      'food', 'fruit', 'vegetable', 'meat', 'bread', 'cheese', 'milk', 'drink', 'juice', 'soda',
      'coffee', 'tea', 'beer', 'wine', 'alcohol', 'snack', 'chip', 'cookie', 'candy', 'chocolate',
      
      // Sports equipment (easily movable)
      'sports ball', 'baseball bat', 'tennis racket', 'frisbee', 'skateboard', 'surfboard', 'skis', 'snowboard',
      'bicycle', 'bike', 'tricycle', 'scooter', 'roller skate', 'skateboard',
      'weights', 'dumbbell', 'barbell', 'kettlebell', 'yoga mat', 'exercise ball', 'foam roller',
      'resistance band', 'jump rope', 'boxing glove', 'baseball glove', 'football', 'soccer ball',
      'basketball', 'tennis ball', 'golf ball', 'bowling ball', 'ping pong', 'shuttlecock',
      
      // Toys and small items
      'teddy bear', 'kite', 'toy', 'doll', 'game', 'puzzle', 'lego', 'action figure',
      'toy train', 'toy car', 'toy plane', 'toy block', 'bouncy ball', 'toy animal',
      
      // Bathroom items (toiletries, towels, personal care)
      'toothbrush', 'toothpaste', 'shampoo', 'soap', 'lotion', 'cosmetics', 'makeup',
      'towel', 'bath towel', 'hand towel', 'washcloth', 'face washer', 'bath mat', 'shower curtain', 'bathroom mat', 'rug',
      'hair drier', 'hair dryer', 'blow dryer', 'brush', 'comb', 'hair brush', 'paddle brush',
      'razor', 'safety razor', 'perfume', 'cologne', 'deodorant', 'antiperspirant',
      'tissue', 'tissue box', 'cotton', 'cotton ball', 'cotton pad', 'q-tip', 'qtip',
      'makeup', 'lipstick', 'foundation', 'concealer', 'eyeshadow', 'eyeliner', 'mascara',
      'bathroom accessories', 'toiletries', 'bath products', 'shower gel', 'body wash', 'moisturizer',
      'soap dispenser', 'lotion pump', 'toothbrush holder', 'bathroom caddy', 'shower caddy',
      
      // Bedroom items
      'pillow', 'blanket', 'sheet', 'comforter', 'bedspread', 'duvet', 'mattress', 'pillow case', 'pillowcase',
      'nightstand', 'dresser', 'chest', 'closet', 'wardrobe', 'hanger', 'coat hanger', 'shoe rack',
      'bed frame', 'headboard', 'footboard', 'bed skirt',
      
      // Living room items & furniture
      'cushion', 'throw pillow', 'throw blanket', 'couch throw', 'ottoman', 'footstool', 'pouf',
      'side table', 'end table', 'coffee table', 'armchair', 'recliner', 'accent chair',
      
      // Office/Desk items
      'scissors', 'pen', 'pencil', 'marker', 'crayon', 'colored pencil',
      'paper', 'document', 'mail', 'magazine', 'newspaper', 'journal', 'notepad',
      'notebook', 'clipboard', 'folder', 'binder', 'stapler', 'tape', 'glue',
      'desk lamp', 'desk organizer', 'pen holder', 'pencil holder', 'sticky note', 'post-it',
      
      // Storage & organization
      'box', 'container', 'basket', 'bag', 'pouch', 'case', 'storage box', 'plastic bin',
      'drawer organizer', 'shelf organizer', 'closet organizer', 'under bed storage',
      
      // Wall decor & art
      'picture', 'photo', 'poster', 'artwork', 'frame', 'framed art', 'wall art', 'wall decor',
      'mirror', 'wall mirror', 'floor mirror', 'decorative mirror',
      
      // Decorative items
      'candle', 'decoration', 'ornament', 'figurine', 'statue', 'sculpture',
      'flower', 'plant', 'flowers', 'bouquet', 'vase', 'flower vase', 'potted plant',
      'book', 'bookcase', 'bookshelf', 'book rack', 'books',
      'rug', 'mat', 'carpet', 'area rug', 'runner rug', 'door mat',
      'lamp', 'table lamp', 'floor lamp', 'accent lamp', 'string light', 'fairy light',
      
      // Cleaning & supplies
      'trash', 'garbage', 'waste', 'recycling', 'trash can', 'garbage can', 'recycling bin',
      'cleaning', 'supplies', 'mop', 'broom', 'vacuum', 'duster', 'sponge', 'brush',
      'cleaner', 'bleach', 'disinfectant', 'wipes', 'paper towel', 'towel dispenser',
      'tool', 'tools', 'toolbox', 'hammer', 'screwdriver', 'wrench', 'pliers', 'drill',
      'paint', 'paintbrush', 'paint roller', 'paint can',
      
      // Miscellaneous clutter
      'clothing', 'laundry', 'clothes', 'clothes hanger', 'clothesline',
      'sign', 'sticker', 'label', 'poster', 'flyer',
      'package', 'packaging', 'wrapping', 'cardboard', 'packing material',
      'decoration', 'garland', 'wreath', 'banner', 'bunting'
    ];
    
    // Home decor items (can stay if minimal and styled)
    const decorItems = [
      'picture', 'photo', 'poster', 'artwork', 'frame',
      'candle', 'decoration', 'ornament', 'figurine', 'statue',
      'flower', 'plant', 'flowers', 'bouquet',
      'book', 'basket',
      'rug', 'mat', 'carpet'
    ];
    
    // Items to EXCLUDE (only major fixed furniture/appliances that should stay)
    const furnitureToKeep = [
      'couch', 'sofa', 'bed', 'dining table', 'toilet', 'tv', 'sink', 'oven', 'refrigerator',
      'microwave', 'wall', 'door', 'window', 'ceiling', 'floor'
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
      
      // Check if it's decor vs clutter
      const isDecorItem = decorItems.some(item => 
        name.includes(item) || item.includes(name)
      );
      
      // If it matches a known easy-to-remove item, return it with detailed reason
      if (easyToRemoveItems.some(item => 
        name.includes(item) || item.includes(name)
      )) {
        let reason = '';
        let category = 'clutter';
        
        // Provide specific reasons based on item type
        if (['person', 'dog', 'cat', 'bird'].some(p => name.includes(p))) {
          reason = 'Buyers focus on the space, not current occupants';
          category = 'occupant';
        } else if (['bottle', 'cup', 'bowl', 'plate', 'dish', 'glass', 'mug', 'fork', 'knife', 'spoon'].some(i => name.includes(i))) {
          reason = 'Clear surfaces make kitchens look spacious and clean';
          category = 'mess';
        } else if (['towel', 'toothbrush', 'soap', 'shampoo', 'lotion', 'makeup', 'cosmetics'].some(i => name.includes(i))) {
          reason = 'Bathrooms should look spa-like and depersonalized';
          category = 'mess';
        } else if (['pillow', 'blanket', 'sheet', 'clothes', 'jacket', 'shirt', 'pants', 'shoes'].some(i => name.includes(i))) {
          reason = 'Bedrooms need minimal styling - less is more';
          category = 'mess';
        } else if (['laptop', 'phone', 'remote', 'keyboard', 'mouse', 'headphones'].some(i => name.includes(i))) {
          reason = 'Electronics create visual clutter and distraction';
          category = 'clutter';
        } else if (['paper', 'magazine', 'document', 'mail', 'trash', 'garbage'].some(i => name.includes(i))) {
          reason = 'Paper clutter and trash makes spaces look busy and unkempt';
          category = 'mess';
        } else if (['wire', 'cable', 'cord', 'charger'].some(i => name.includes(i))) {
          reason = 'Visible cables and wires look messy and unprofessional';
          category = 'mess';
        } else if (['cleaning', 'mop', 'broom', 'vacuum', 'tool'].some(i => name.includes(i))) {
          reason = 'Cleaning supplies and tools should be hidden away';
          category = 'mess';
        } else if (['toy', 'teddy bear', 'doll', 'game'].some(i => name.includes(i))) {
          reason = 'Toys distract from the home\'s features';
          category = 'clutter';
        } else if (['photo', 'picture'].some(i => name.includes(i))) {
          reason = 'Personal photos should be removed for neutral appeal';
          category = 'personal';
        } else if (['book'].includes(name)) {
          reason = 'Too many books create visual clutter - limit to 3-5 styled books';
          category = 'decor-excessive';
        } else if (['candle', 'flower', 'plant', 'bouquet'].some(i => name.includes(i))) {
          reason = 'Decor is good, but keep minimal - 1-2 accent pieces per surface';
          category = 'decor-check';
        } else if (['artwork', 'poster', 'decoration', 'ornament'].some(i => name.includes(i))) {
          reason = 'Evaluate if decor is tasteful and minimal - remove if excessive';
          category = 'decor-check';
        } else {
          reason = 'Creates visual clutter - clear for photos';
          category = 'clutter';
        }
        
        return {
          name: className,
          confidence: '100',
          location: `${(bbox[0]).toFixed(0)}, ${(bbox[1]).toFixed(0)}`,
          type: 'specific',
          reason: reason,
          itemCategory: category
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

    // Deduplicate items - group by item name and show only once with count
    const deduplicatedItems = {};
    const itemOrder = [];
    
    specificItems.forEach(item => {
      const itemKey = item.name.toLowerCase();
      if (!deduplicatedItems[itemKey]) {
        deduplicatedItems[itemKey] = {
          ...item,
          count: 1
        };
        itemOrder.push(itemKey);
      } else {
        deduplicatedItems[itemKey].count += 1;
      }
    });
    
    // Convert back to array, maintaining order
    const uniqueSpecificItems = itemOrder.map(key => deduplicatedItems[key]);

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

    return [...uniqueSpecificItems, ...generalRecommendations];
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
