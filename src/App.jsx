import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import ObjectDetector from './components/ObjectDetector';
import RemovalList from './components/RemovalList';
import './App.css';

// Self-learning: Load user patterns from localStorage
const loadUserPatterns = () => {
  try {
    const saved = localStorage.getItem('photoPrep_userPatterns');
    return saved ? JSON.parse(saved) : { roomHistory: {}, itemFeedback: {} };
  } catch {
    return { roomHistory: {}, itemFeedback: {} };
  }
};

const saveUserPatterns = (patterns) => {
  try {
    localStorage.setItem('photoPrep_userPatterns', JSON.stringify(patterns));
  } catch {}
};

function App() {
  const [cameraImage, setCameraImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [removalRecommendations, setRemovalRecommendations] = useState([]);
  const [userPatterns] = useState(loadUserPatterns());

  const handleCapture = (imageSrc) => {
    setCameraImage(imageSrc);
    setDetectedObjects([]);
    setRemovalRecommendations([]);
  };

  const handleDetectionComplete = (objects) => {
    console.log('Detection complete, received objects:', objects.length);
    setDetectedObjects(objects);
    
    // Intelligent confidence filtering: adaptive thresholds based on object type and room
    const roomInfo = detectRoomType(objects);
    const roomType = typeof roomInfo === 'string' ? roomInfo : roomInfo.type;
    console.log('Detected room type:', roomType, roomInfo);
    
    // Learn from usage: boost confidence for frequently detected items in this room type
    const intelligentObjects = objects.filter(obj => {
      const baseThreshold = 0.15; // Lowered to catch more valid detections
      const className = obj.class.toLowerCase();
      
      // High-priority items always included (people, clutter)
      if (['person', 'dog', 'cat', 'bottle', 'cup', 'bowl', 'phone', 'laptop'].some(p => className.includes(p))) {
        return obj.score >= 0.12;
      }
      
      // Room-specific items get lower thresholds
      if (roomType === 'kitchen' && ['cup', 'plate', 'bowl', 'bottle', 'fork', 'knife', 'spoon'].some(k => className.includes(k))) {
        return obj.score >= 0.12;
      }
      if (roomType === 'bathroom' && ['towel', 'toothbrush', 'soap', 'tissue'].some(b => className.includes(b))) {
        return obj.score >= 0.12;
      }
      if (roomType === 'bedroom' && ['pillow', 'blanket', 'clothes'].some(b => className.includes(b))) {
        return obj.score >= 0.12;
      }
      
      return obj.score >= baseThreshold;
    });
    
    console.log('After filtering:', intelligentObjects.length, 'objects above threshold');
    
    // Track room detection for self-improvement
    if (roomType !== 'general' && roomInfo.confidence) {
      userPatterns.roomHistory[roomType] = (userPatterns.roomHistory[roomType] || 0) + 1;
      saveUserPatterns(userPatterns);
    }
    
    const recommendations = filterForRemoval(intelligentObjects, roomType);
    console.log('Generated recommendations:', recommendations.length);
    setRemovalRecommendations(recommendations);
  };

  const detectRoomType = (objects) => {
    const classes = objects.map(obj => obj.class.toLowerCase());
    
    // ENHANCED room indicators with more specific patterns
    const kitchenIndicators = {
      strong: ['oven', 'microwave', 'refrigerator', 'stove', 'dishwasher', 'sink', 'countertop'], // 5 points each
      medium: ['toaster', 'kettle', 'pot', 'pan', 'glass', 'cup', 'plate', 'bowl', 'dish', 'bottle', 'fork', 'spoon', 'knife'], // 2 points each
      weak: ['table', 'chair', 'cabinet', 'drawer', 'light'] // 0.5 points each
    };
    
    const bathroomIndicators = {
      strong: ['toilet', 'bathtub', 'shower', 'sink', 'mirror'], // 5 points each
      medium: ['towel', 'toothbrush', 'shampoo', 'soap', 'lotion', 'toilet paper', 'tissue'], // 2 points each
      weak: ['cabinet', 'light', 'door'] // 0.5 points each
    };
    
    const bedroomIndicators = {
      strong: ['bed', 'bedspread', 'pillow', 'blanket', 'nightstand', 'dresser'], // 5 points each
      medium: ['lamp', 'mirror', 'chair', 'desk', 'closet', 'hanger'], // 2 points each
      weak: ['wall', 'floor', 'window', 'door'] // 0.5 points each
    };
    
    const livingRoomIndicators = {
      strong: ['couch', 'sofa', 'tv', 'coffee table', 'armchair', 'recliner'], // 5 points each
      medium: ['lamp', 'rug', 'picture', 'cushion', 'throw pillow', 'ottoman'], // 2 points each
      weak: ['chair', 'table', 'wall', 'window', 'light'] // 0.5 points each
    };
    
    const diningRoomIndicators = {
      strong: ['dining table', 'chair', 'place setting'], // 5 points each
      medium: ['plate', 'glass', 'fork', 'knife', 'spoon', 'napkin', 'centerpiece'], // 2 points each
      weak: ['table', 'chandelier', 'wall', 'window'] // 0.5 points each
    };
    
    // Calculate weighted scores
    let scores = {
      kitchen: 0,
      bathroom: 0,
      bedroom: 0,
      'living room': 0,
      'dining room': 0
    };
    
    classes.forEach(c => {
      // Kitchen
      if (kitchenIndicators.strong.some(k => c.includes(k))) scores.kitchen += 5;
      else if (kitchenIndicators.medium.some(k => c.includes(k))) scores.kitchen += 2;
      else if (kitchenIndicators.weak.some(k => c.includes(k))) scores.kitchen += 0.5;
      
      // Bathroom
      if (bathroomIndicators.strong.some(k => c.includes(k))) scores.bathroom += 5;
      else if (bathroomIndicators.medium.some(k => c.includes(k))) scores.bathroom += 2;
      else if (bathroomIndicators.weak.some(k => c.includes(k))) scores.bathroom += 0.5;
      
      // Bedroom
      if (bedroomIndicators.strong.some(k => c.includes(k))) scores.bedroom += 5;
      else if (bedroomIndicators.medium.some(k => c.includes(k))) scores.bedroom += 2;
      else if (bedroomIndicators.weak.some(k => c.includes(k))) scores.bedroom += 0.5;
      
      // Living room
      if (livingRoomIndicators.strong.some(k => c.includes(k))) scores['living room'] += 5;
      else if (livingRoomIndicators.medium.some(k => c.includes(k))) scores['living room'] += 2;
      else if (livingRoomIndicators.weak.some(k => c.includes(k))) scores['living room'] += 0.5;
      
      // Dining room
      if (diningRoomIndicators.strong.some(k => c.includes(k))) scores['dining room'] += 5;
      else if (diningRoomIndicators.medium.some(k => c.includes(k))) scores['dining room'] += 2;
      else if (diningRoomIndicators.weak.some(k => c.includes(k))) scores['dining room'] += 0.5;
    });
    
    // Find room with highest score
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([type, score]) => ({ type, score }));
    
    // Return highest if it significantly outscores others
    if (sorted[0].score > sorted[1].score * 1.5 && sorted[0].score >= 5) {
      return { type: sorted[0].type, confidence: sorted[0].score, allScores: scores };
    }
    
    return { type: 'general', confidence: 0, allScores: scores };
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
    
    // Items to EXCLUDE (only large/fixed furniture that cannot be moved)
    const largeFurnitureToKeep = [
      'couch', 'sofa', 'loveseat', 'sectional',
      'bed', 'king bed', 'queen bed',
      'dining table', 'table',
      'toilet', 'bathtub', 'shower',
      'tv', 'television',
      'sink', 'oven', 'refrigerator', 'fridge', 'stove', 'dishwasher',
      'microwave', 'washer', 'dryer',
      'bookcase', 'bookshelf', 'cabinet', 'wardrobe', 'armoire',
      'wall', 'door', 'window', 'ceiling', 'floor'
    ];
    
    // Movable furniture that could obstruct space (considered for removal suggestions)
    const movableFurniture = [
      'chair', 'dining chair', 'office chair', 'desk chair', 'folding chair',
      'stool', 'bar stool', 'ottoman', 'footstool', 'pouf',
      'side table', 'end table', 'nightstand', 'accent table',
      'bench', 'small table'
    ];

    // Track movable furniture for styling tips
    const detectedMovableFurniture = [];
    
    // Categorize unidentified objects by room and position
    const categorizeClutter = (className, roomType, bbox) => {
      const name = className.toLowerCase();
      
      // Check if it's large furniture we should keep
      if (largeFurnitureToKeep.some(furniture => 
        name.includes(furniture) || furniture.includes(name)
      )) {
        return null;
      }
      
      // Track movable furniture but don't add to clutter list (will go in styling tips)
      if (movableFurniture.some(item => name.includes(item) || item.includes(name))) {
        detectedMovableFurniture.push({ name: className, bbox });
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

    // Add professional styling tips based on detected room type
    const generalRecommendations = [];
    
    // Show room-specific tips even without detecting specific appliances/furniture
    if (roomType === 'kitchen') {
      generalRecommendations.push({
        name: 'Kitchen Staging Tips',
        confidence: '100',
        location: 'Kitchen',
        type: 'styling',
        tips: [
          'Clear ALL countertops - show maximum space',
          'Remove magnets and papers from fridge',
          'Hide dish soap, sponges, cleaning supplies',
          'Put away small appliances',
          'Stage with ONE bowl of fruit or flowers',
          'Close all cabinet doors',
          'Turn on under-cabinet lighting'
        ]
      });
    } else if (roomType === 'bathroom') {
      generalRecommendations.push({
        name: 'Bathroom Staging Tips',
        confidence: '100',
        location: 'Bathroom',
        type: 'styling',
        tips: [
          'Remove ALL toiletries from surfaces',
          'Hide toothbrushes, soap, bottles',
          'Stage with 2-3 white fluffy towels only',
          'Close toilet lid',
          'Close shower curtain neatly',
          'Add ONE small plant or candle',
          'Polish mirrors until spotless',
          'Turn on all lights for spa feel'
        ]
      });
    } else if (roomType === 'bedroom') {
      generalRecommendations.push({
        name: 'Bedroom Staging Tips',
        confidence: '100',
        location: 'Bedroom',
        type: 'styling',
        tips: [
          'Make bed with crisp, neutral linens',
          'Clear nightstands completely',
          'Limit to 4-6 decorative pillows max',
          'Hide ALL clothes and shoes',
          'Close closet doors',
          'Add matching bedside lamps',
          'Keep floor completely clear'
        ]
      });
    } else if (roomType === 'living room') {
      const tips = [
        'Hide remotes, cables, electronics',
        'Limit throw pillows to 3-4',
        'Clear coffee table except 1-2 items',
        'Remove personal photos',
        'Add fresh flowers or greenery',
        'Use multiple light sources',
        'Show flow and walking space'
      ];
      
      // Add chair removal tip if detected
      if (detectedMovableFurniture.length > 0) {
        const chairs = detectedMovableFurniture.filter(f => 
          f.name.toLowerCase().includes('chair') || f.name.toLowerCase().includes('stool')
        );
        if (chairs.length > 2) {
          tips.push(`Consider removing ${chairs.length - 2} extra chair(s) to make room feel more spacious`);
        } else if (chairs.length > 0) {
          tips.push('Evaluate if extra chairs obstruct walking space - remove if needed');
        }
      }
      
      generalRecommendations.push({
        name: 'Living Room Staging Tips',
        confidence: '100',
        location: 'Living room',
        type: 'styling',
        tips
      });
    } else {
      // Generic tips for unidentified rooms
      const tips = [
        'Remove ALL personal items and clutter',
        'Clear surfaces - less is more',
        'Maximize natural and artificial light',
        'Add minimal, neutral decor',
        'Create sense of space and flow',
        'Shoot from corners to show room size'
      ];
      
      // Add furniture removal tip if detected
      if (detectedMovableFurniture.length > 0) {
        const furniture = detectedMovableFurniture.map(f => f.name.toLowerCase()).join(', ');
        tips.push(`Consider removing movable furniture (${furniture}) if it makes the space feel crowded`);
      }
      
      generalRecommendations.push({
        name: 'General Staging Tips',
        confidence: '100',
        location: 'Any room',
        type: 'styling',
        tips
      });
    }
    
    const result = [...uniqueSpecificItems, ...generalRecommendations];
    console.log('filterForRemoval returning:', result.length, 'recommendations');
    return result;
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
