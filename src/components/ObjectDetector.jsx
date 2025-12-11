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
  const detectingRef = useRef(false); // prevent overlapping detections
  const onDetectionCompleteRef = useRef(onDetectionComplete);
  
  // Keep callback ref updated
  useEffect(() => {
    onDetectionCompleteRef.current = onDetectionComplete;
  }, [onDetectionComplete]);

  useEffect(() => {
    if (!image) return;

    const detectObjects = async () => {
      if (detectingRef.current) {
        console.log('Detection already in progress, skipping');
        return;
      }
      detectingRef.current = true;
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

        // Get image dimensions - wait for image to load
        const img = imgRef.current;
        if (!img) {
          throw new Error('Image reference not found');
        }
        
        const loadImage = () => {
          return new Promise((resolve) => {
            if (img.complete) {
              console.log('Image already loaded, dimensions:', img.width, 'x', img.height);
              resolve();
            } else {
              img.onload = () => {
                console.log('Image loaded, dimensions:', img.width, 'x', img.height);
                resolve();
              };
              img.onerror = () => {
                throw new Error('Failed to load image');
              };
            }
          });
        };
        
        await loadImage();
        await runDetection(model);

        async function runDetection(model) {
          // OPTIMIZED: Use 800px max dimension for faster processing without quality loss
          const MAX_DIMENSION = 800;
          const detectionScale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height, 1);
          const targetWidth = Math.round(img.width * detectionScale);
          const targetHeight = Math.round(img.height * detectionScale);

          // Draw scaled image to an offscreen canvas for detection
          const inputCanvas = document.createElement('canvas');
          inputCanvas.width = targetWidth;
          inputCanvas.height = targetHeight;
          const inputCtx = inputCanvas.getContext('2d');
          
          // Draw image without modifying lighting
          inputCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

          console.log('Running optimized detection:', targetWidth, 'x', targetHeight);
          
          // SIMPLIFIED: Single-pass detection with optimized parameters for speed + accuracy
          let predictions = [];
          try {
            if (model.detect) {
              // Single detection pass with balanced settings
              predictions = await model.detect(inputCanvas, 100, 0.15);
              console.log('Single-pass detection complete:', predictions.length, 'objects');
            } else if (model.estimateObjects) {
              predictions = await model.estimateObjects(img);
            } else {
              throw new Error('No detection method found on model');
            }
          } catch (methodErr) {
            console.error('Detection error:', methodErr);
            throw new Error(`Detection failed: ${methodErr.message}`);
          }
          
          console.log('Predictions received:', predictions.length, 'objects');
          predictions.forEach((p, idx) => {
            console.log(`  ${idx}: ${p.class} (${(p.score * 100).toFixed(1)}%)`);
          });

          // Sort by confidence
          predictions.sort((a, b) => b.score - a.score);

          onDetectionCompleteRef.current(predictions);

          // Draw bounding boxes on canvas at FULL RESOLUTION matching display image
          if (canvasRef.current && img.complete) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Set canvas to ORIGINAL image dimensions (what will be displayed)
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            console.log('Drawing on canvas at full resolution:', img.naturalWidth, 'x', img.naturalHeight);
            console.log('Detection was done at scale:', detectionScale);

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

            // Draw boxes ONLY for clutter items that we recommend removing
            predictions.forEach(prediction => {
              // Scale bbox coordinates from detection scale back to full image resolution
              let [x, y, width, height] = prediction.bbox;
              x = x / detectionScale;
              y = y / detectionScale;
              width = width / detectionScale;
              height = height / detectionScale;
              
              const score = prediction.score;
              const className = prediction.class.toLowerCase();
              
              // Skip furniture; we never highlight fixed items
              const isFurniture = furnitureToKeep.some(furniture => 
                className.includes(furniture) || furniture.includes(className)
              );
              
              if (isFurniture || score < 0.12) {
                return;
              }
              
              // Check item categories
              const isKnownItem = easyToRemoveItems.some(item => 
                className.includes(item) || item.includes(className)
              );
              
              const isHighPriority = highPriorityItems.some(item => 
                className.includes(item) || item.includes(className)
              );

              // Only highlight items we would recommend removing
              if (!isHighPriority && !isKnownItem) {
                return;
              }
              
              // Color coding: prioritize what should be removed
              let boxColor, fillColor, lineWidth;
              if (isHighPriority) {
                // High priority items - bright red, thick border
                boxColor = '#ef4444';
                fillColor = 'rgba(239, 68, 68, 0.25)';
                lineWidth = 5;
              } else if (isKnownItem) {
                // Known removal items - blue
                boxColor = '#3b82f6';
                fillColor = 'rgba(59, 130, 246, 0.15)';
                lineWidth = 3;
              } else {
                // Unknown items - orange, draw for review
                boxColor = '#f97316';
                fillColor = 'rgba(249, 115, 22, 0.15)';
                lineWidth = 2;
              }

              // Draw semi-transparent fill to highlight area
              ctx.fillStyle = fillColor;
              ctx.fillRect(x, y, width, height);

              // Draw box border
              ctx.strokeStyle = boxColor;
              ctx.lineWidth = lineWidth;
              ctx.strokeRect(x, y, width, height);

              // Draw label background with item name
              ctx.fillStyle = boxColor;
              const text = `${prediction.class} ${(score * 100).toFixed(0)}%`;
              ctx.font = 'bold 18px Arial';
              const textWidth = ctx.measureText(text).width;
              const labelHeight = 32;
              ctx.fillRect(x, y - labelHeight, textWidth + 16, labelHeight);
              
              // Draw label text
              ctx.fillStyle = 'white';
              ctx.font = 'bold 18px Arial';
              ctx.fillText(text, x + 8, y - 9);
              
              console.log(`Drawing box for ${className} (${score.toFixed(2)}) at [${x.toFixed(0)}, ${y.toFixed(0)}]`);
            });
            console.log('Canvas drawn with', predictions.length, 'predictions at full resolution');
          }
        }
      } catch (err) {
        console.error('Detection error full:', err);
        setError('Failed to detect objects:\n' + (err.message || String(err)));
      } finally {
        setIsLoading(false);
        detectingRef.current = false;
      }
    };

    detectObjects();
  }, [image]); // Only re-run when image changes, not on callback changes

  return (
    <div className="object-detector">
      <div className="detector-card">
        <h2>Object Detection</h2>
        
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
          
          {!isLoading && image && (
            <div style={{ 
              position: 'relative',
              width: '100%',
              display: 'inline-block'
            }}>
              <img 
                src={image} 
                alt="Detection base"
                style={{
                  width: '100%',
                  display: 'block',
                  borderRadius: '12px',
                  border: '1px solid #f0f0f0'
                }}
              />
              <canvas 
                ref={canvasRef} 
                className="detection-canvas"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  borderRadius: '12px',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          )}

          {!isLoading && detectedObjects.length > 0 && (
            <div className="detection-stats">
              <p>Detected {detectedObjects.length} objects</p>
            </div>
          )}
          
          {!isLoading && detectedObjects.length === 0 && !error && image && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#999',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}>
              <p>No objects detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ObjectDetector;
