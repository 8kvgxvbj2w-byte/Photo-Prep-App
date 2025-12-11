import React, { useEffect, useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import './ObjectDetector.css';

let modelCache = null; // Cache the model globally

function ObjectDetector({ image, onDetectionComplete, detectedObjects }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!image) return;

    const detectObjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Image received, loading model...');
        console.log('Image data length:', image.length);
        
        // Load or use cached model with higher accuracy settings
        let model;
        if (modelCache) {
          console.log('Using cached model');
          model = modelCache;
        } else {
          console.log('Loading new model...');
          const modelPromise = cocoSsd.load({
            base: 'mobilenet_v2' // Higher accuracy model for better object recognition
          });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Model loading timeout after 60 seconds')), 60000)
          );
          
          model = await Promise.race([modelPromise, timeoutPromise]);
          modelCache = model; // Cache for future use
          console.log('Model loaded and cached successfully');
        }

        // Get image dimensions
        const img = imgRef.current;
        if (!img.complete) {
          console.log('Image not loaded yet, waiting for onload...');
          img.onload = () => {
            console.log('Image loaded, dimensions:', img.width, 'x', img.height);
            runDetection(model);
          };
          return;
        }
        
        console.log('Image already loaded, dimensions:', img.width, 'x', img.height);
        await runDetection(model);

        async function runDetection(model) {
          const MAX_DIMENSION = 1024; // Increased for better detail capture
          const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height, 1);
          const targetWidth = Math.round(img.width * scale);
          const targetHeight = Math.round(img.height * scale);

          // Draw scaled image to an offscreen canvas for detection
          const inputCanvas = document.createElement('canvas');
          inputCanvas.width = targetWidth;
          inputCanvas.height = targetHeight;
          const inputCtx = inputCanvas.getContext('2d');
          
          // Draw and enhance image for better recognition
          inputCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
          enhanceImageContrast(inputCtx, targetWidth, targetHeight);

          console.log('Running detection on image (scaled):', targetWidth, 'x', targetHeight, 'scale', scale.toFixed(3));
          
          // Run detection with ENHANCED parameters for better accuracy
          let predictions = [];
          try {
            if (model.detect) {
              console.log('Running intelligent multi-scale detection');
              // ORIGINAL SCALE - Always detect at original scale first for comprehensive results
              const pred1 = await model.detect(inputCanvas, 200, 0.08);
              predictions = predictions.concat(pred1);
              
              // SMART SCALING DECISION: Only do additional scales for ambiguous cases
              // Check if we have enough good detections for basic room identification
              const topDetections = pred1.sort((a, b) => b.score - a.score).slice(0, 10);
              const roomIndicatorStrength = analyzeRoomStrength(topDetections);
              
              console.log('Room indicator strength:', roomIndicatorStrength);
              
              // If room is unclear, run additional scales for better coverage
              // Otherwise, use minimal scales to save time
              if (roomIndicatorStrength < 15) {
                console.log('Weak room detection - running additional scales for coverage');
                
                // UPSCALE for large objects
                if (targetWidth * 1.3 < 1600) {
                  const upscaleCanvas = document.createElement('canvas');
                  upscaleCanvas.width = Math.round(targetWidth * 1.3);
                  upscaleCanvas.height = Math.round(targetHeight * 1.3);
                  const upscaleCtx = upscaleCanvas.getContext('2d');
                  upscaleCtx.drawImage(inputCanvas, 0, 0, upscaleCanvas.width, upscaleCanvas.height);
                  const pred2 = await model.detect(upscaleCanvas, 150, 0.08);
                  pred2.forEach(p => {
                    p.bbox = [p.bbox[0] / 1.3, p.bbox[1] / 1.3, p.bbox[2] / 1.3, p.bbox[3] / 1.3];
                  });
                  predictions = predictions.concat(pred2);
                }
                
                // DOWNSCALE for small distant objects
                const downscaleCanvas = document.createElement('canvas');
                downscaleCanvas.width = Math.round(targetWidth * 0.8);
                downscaleCanvas.height = Math.round(targetHeight * 0.8);
                const downscaleCtx = downscaleCanvas.getContext('2d');
                downscaleCtx.drawImage(inputCanvas, 0, 0, downscaleCanvas.width, downscaleCanvas.height);
                const pred3 = await model.detect(downscaleCanvas, 150, 0.08);
                pred3.forEach(p => {
                  p.bbox = [p.bbox[0] / 0.8, p.bbox[1] / 0.8, p.bbox[2] / 0.8, p.bbox[3] / 0.8];
                });
                predictions = predictions.concat(pred3);
              } else {
                console.log('Strong room detection - using optimized single-scale for speed');
                // Room is clear, use just the original scale for faster results
              }
              
              // Merge duplicate detections from multiple scales
              predictions = mergeDuplicateDetections(predictions);
              console.log('After multi-scale merge:', predictions.length, 'unique objects');
            } else if (model.estimateObjects) {
              console.log('Using estimateObjects API');
              predictions = await model.estimateObjects(img);
            } else {
              throw new Error('No detection method found on model. Available methods: ' + Object.keys(model).join(', '));
            }
          } catch (methodErr) {
            console.error('Detection method error:', methodErr);
            throw new Error(`Detection method failed: ${methodErr.message}`);
          }
          
          console.log('Predictions received:', predictions.length, 'objects');
          predictions.forEach((p, idx) => {
            console.log(`  ${idx}: ${p.class} (${(p.score * 100).toFixed(1)}%)`);
          });

          // Sort by confidence
          predictions.sort((a, b) => b.score - a.score);

          onDetectionComplete(predictions);

          // Draw bounding boxes
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Draw scaled image
            ctx.drawImage(inputCanvas, 0, 0);

            // Common removal items list for canvas highlighting
            const easyToRemoveItems = [
              'person', 'dog', 'cat', 'bird',
              'backpack', 'handbag', 'suitcase', 'umbrella', 'tie', 'bag', 'purse', 'wallet', 'jacket', 'coat', 'sweater', 'shirt', 'pants', 'shoes',
              'cell phone', 'remote', 'laptop', 'keyboard', 'mouse', 'monitor', 'phone', 'tablet', 'ipad', 'computer', 'headphones', 'speaker', 'camera',
              'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'pot', 'pan',
              'plate', 'dish', 'glass', 'mug', 'utensil', 'cutlery', 'silverware', 'dinnerware',
              'drinking glass', 'coffee cup', 'tea cup', 'saucer', 'platter', 'pitcher', 'kettle',
              'container', 'jar', 'lid', 'cap', 'sauce', 'condiment', 'spice', 'seasoning',
              'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
              'food', 'fruit', 'vegetable', 'meat', 'bread', 'cheese', 'milk', 'drink',
              'sports ball', 'baseball bat', 'tennis racket', 'frisbee', 'skateboard', 'surfboard', 'skis', 'snowboard',
              'bicycle', 'bike', 'weights', 'dumbbell', 'yoga mat', 'exercise ball',
              'teddy bear', 'kite', 'toy', 'doll', 'game', 'puzzle', 'lego',
              'toothbrush', 'toothpaste', 'shampoo', 'soap', 'lotion', 'cosmetics',
              'towel', 'face washer', 'washcloth', 'bath mat', 'shower curtain', 'bathroom mat',
              'hair drier', 'hair dryer', 'brush', 'comb', 'razor', 'perfume', 'cologne',
              'tissue', 'tissue box', 'cotton', 'makeup', 'deodorant', 'medicine', 'vitamins',
              'bathroom accessories', 'toiletries', 'bath products', 'shower gel', 'body wash', 'moisturizer',
              'pillow', 'blanket', 'sheet', 'comforter', 'bedspread', 'duvet', 'mattress', 'pillow case',
              'nightstand', 'dresser', 'closet', 'wardrobe', 'hanger', 'shoe rack',
              'cushion', 'throw pillow', 'throw blanket', 'couch throw', 'ottoman', 'footstool',
              'scissors', 'pen', 'pencil', 'paper', 'document', 'mail', 'magazine',
              'book', 'notebook', 'clipboard', 'folder', 'binder',
              'box', 'container', 'basket', 'bag', 'pouch', 'case',
              'picture', 'photo', 'poster', 'artwork', 'frame',
              'candle', 'decoration', 'ornament', 'figurine', 'statue',
              'flower', 'plant', 'flowers', 'bouquet'
            ];

            // Only exclude major structural/fixed items from highlighting
            const furnitureToKeep = [
              'couch', 'sofa', 'bed', 'dining table', 'toilet', 'tv', 'sink', 'oven', 'refrigerator',
              'microwave', 'wall', 'door', 'window', 'ceiling', 'floor'
            ];
            
            // High priority items that should be very obvious
            const highPriorityItems = [
              'person', 'dog', 'cat', 'bird',
              'bottle', 'cup', 'bowl', 'plate', 'dish', 'glass', 'mug', 'pot', 'pan',
              'towel', 'toothbrush', 'toilet paper', 'tissue',
              'cell phone', 'laptop', 'remote', 'keyboard', 'mouse',
              'book', 'paper', 'magazine', 'mail', 'document',
              'clothes', 'clothing', 'shirt', 'pants', 'jacket', 'shoes',
              'bag', 'backpack', 'purse', 'handbag',
              'trash', 'garbage', 'box'
            ];

            // Draw boxes for ALL items that need attention, with clear visual hierarchy
            predictions.forEach(prediction => {
              const [x, y, width, height] = prediction.bbox;
              const score = prediction.score.toFixed(3);
              const className = prediction.class.toLowerCase();
              
              // Skip only major fixed furniture/appliances
              const isFurniture = furnitureToKeep.some(furniture => 
                className.includes(furniture) || furniture.includes(className)
              );
              
              if (isFurniture) {
                return; // Don't draw boxes for fixed items
              }
              
              // Check if it's a known removal item
              const isKnownItem = easyToRemoveItems.some(item => 
                className.includes(item) || item.includes(className)
              );
              
              // Check if it's a high priority item
              const isHighPriority = highPriorityItems.some(item => 
                className.includes(item) || item.includes(className)
              );
              
              // Enhanced color coding with semi-transparent fill to show attention areas
              let boxColor, labelColor, lineWidth, fillColor;
              if (isHighPriority) {
                boxColor = '#dc2626'; // Bright red for high priority
                labelColor = '#dc2626';
                fillColor = 'rgba(220, 38, 38, 0.15)'; // Red tint
                lineWidth = 4; // Thicker line
              } else if (isKnownItem) {
                boxColor = '#2563eb'; // Blue for known items
                labelColor = '#2563eb';
                fillColor = 'rgba(37, 99, 235, 0.1)'; // Blue tint
                lineWidth = 3;
              } else {
                boxColor = '#f97316'; // Orange for unknown clutter
                labelColor = '#f97316';
                fillColor = 'rgba(249, 115, 22, 0.12)'; // Orange tint
                lineWidth = 3;
              }

              // Draw semi-transparent fill to highlight area
              ctx.fillStyle = fillColor;
              ctx.fillRect(x, y, width, height);

              // Draw box
              ctx.strokeStyle = boxColor;
              ctx.lineWidth = lineWidth;
              ctx.strokeRect(x, y, width, height);

              // Draw label background
              ctx.fillStyle = labelColor;
              const priorityMarker = isHighPriority ? '⚠️ ' : '';
              const text = `${priorityMarker}${prediction.class} ${(score * 100).toFixed(0)}%`;
              const textWidth = ctx.measureText(text).width;
              ctx.fillRect(x, y - 24, textWidth + 12, 24);
              
              // Draw label text
              ctx.fillStyle = 'white';
              ctx.font = 'bold 14px Arial';
              ctx.fillText(text, x + 6, y - 7);
            });
            console.log('Canvas drawn with', predictions.length, 'predictions');
          }
        }
      } catch (err) {
        console.error('Detection error full:', err);
        setError('Failed to detect objects:\n' + (err.message || String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    detectObjects();
  }, [image, onDetectionComplete]);

  return (
    <div className="object-detector">
      <div className="detector-card">
        <h2>🔍 Object Detection</h2>
        
        <div className="detector-content">
          <img 
            ref={imgRef} 
            src={image} 
            alt="Detection input"
            style={{ display: 'none' }}
          />
          
          {isLoading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Analyzing room...</p>
            </div>
          )}
          
          {error && (
            <div className="error-message" style={{
              padding: '15px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              marginBottom: '10px',
              fontSize: '14px',
              whiteSpace: 'pre-wrap'
            }}>
              {error}
            </div>
          )}
          
          {!isLoading && detectedObjects.length > 0 && (
            <canvas 
              ref={canvasRef} 
              className="detection-canvas"
            />
          )}

          {!isLoading && detectedObjects.length > 0 && (
            <div className="detection-stats">
              <p>Detected {detectedObjects.length} object(s)</p>
            </div>
          )}
          
          {!isLoading && detectedObjects.length === 0 && !error && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#999',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}>
              <p>No objects detected in this image</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function: Enhance image contrast for better object detection
function enhanceImageContrast(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Histogram equalization: Improve contrast
  // Calculate histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i+1] + data[i+2]) / 3;
    histogram[Math.floor(gray)]++;
  }
  
  // Calculate cumulative distribution function
  const cdf = new Array(256).fill(0);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i-1] + histogram[i];
  }
  
  // Normalize CDF
  const cdfMin = cdf.find(v => v > 0);
  const totalPixels = width * height;
  for (let i = 0; i < 256; i++) {
    cdf[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
  }
  
  // Apply histogram equalization
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i+1] + data[i+2]) / 3;
    const newValue = cdf[Math.floor(gray)];
    // Boost contrast while maintaining colors
    const factor = newValue / Math.max(gray, 1);
    data[i] = Math.min(255, data[i] * factor * 0.9); // R
    data[i+1] = Math.min(255, data[i+1] * factor * 0.9); // G
    data[i+2] = Math.min(255, data[i+2] * factor * 0.9); // B
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// Helper function: Merge duplicate detections from multiple scales
function mergeDuplicateDetections(predictions) {
  if (predictions.length === 0) return predictions;
  
  const merged = [];
  const used = new Set();
  
  for (let i = 0; i < predictions.length; i++) {
    if (used.has(i)) continue;
    
    const p1 = predictions[i];
    let bestMatch = { index: i, overlap: 0, score: p1.score };
    
    // Find overlapping detections (likely duplicates from different scales)
    for (let j = i + 1; j < predictions.length; j++) {
      if (used.has(j)) continue;
      
      const p2 = predictions[j];
      
      // Same class name?
      if (p1.class.toLowerCase() !== p2.class.toLowerCase()) continue;
      
      // Calculate IoU (Intersection over Union)
      const [x1, y1, w1, h1] = p1.bbox;
      const [x2, y2, w2, h2] = p2.bbox;
      
      const xIntersect = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
      const yIntersect = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
      const intersection = xIntersect * yIntersect;
      const union = w1 * h1 + w2 * h2 - intersection;
      const iou = union > 0 ? intersection / union : 0;
      
      // If significant overlap (>0.3), likely same object
      if (iou > 0.3 && p2.score > bestMatch.score) {
        bestMatch = { index: j, overlap: iou, score: p2.score };
      }
    }
    
    // Keep the higher confidence detection
    const keepIndex = bestMatch.index;
    merged.push(predictions[keepIndex]);
    used.add(i);
    used.add(keepIndex);
  }
  
  return merged;
}

// Helper function: Analyze if detections contain strong room indicators
function analyzeRoomStrength(detections) {
  const kitchenStrong = ['oven', 'microwave', 'refrigerator', 'stove', 'dishwasher'];
  const bathroomStrong = ['toilet', 'bathtub', 'shower'];
  const bedroomStrong = ['bed'];
  const livingRoomStrong = ['couch', 'sofa', 'tv'];

  let strength = 0;
  
  detections.forEach(det => {
    const className = det.class.toLowerCase();
    
    // Add points for strong indicators
    if (kitchenStrong.concat(bathroomStrong).concat(bedroomStrong).concat(livingRoomStrong)
      .some(indicator => className.includes(indicator))) {
      strength += det.score * 10; // Weight by confidence
    }
  });
  
  return strength;
}

export default ObjectDetector;
