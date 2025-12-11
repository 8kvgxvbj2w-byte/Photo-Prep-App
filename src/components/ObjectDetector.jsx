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
            base: 'lite_mobilenet_v2' // Faster inference for quick analysis
          });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Model loading timeout after 30 seconds')), 30000)
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
          const MAX_DIMENSION = 640; // smaller size for faster processing
          const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height, 1);
          const targetWidth = Math.round(img.width * scale);
          const targetHeight = Math.round(img.height * scale);

          // Draw scaled image to an offscreen canvas for detection
          const inputCanvas = document.createElement('canvas');
          inputCanvas.width = targetWidth;
          inputCanvas.height = targetHeight;
          const inputCtx = inputCanvas.getContext('2d');
          
          // Draw image directly without enhancement for speed
          inputCtx.drawImage(img, 0, 0, targetWidth, targetHeight);

          console.log('Running detection on image (scaled):', targetWidth, 'x', targetHeight, 'scale', scale.toFixed(3));
          // Run detection with optimized parameters for distant objects
          let predictions;
          try {
            // Try the newer API first
            if (model.estimateObjects) {
              console.log('Using estimateObjects API');
              predictions = await model.estimateObjects(img);
            } else if (model.detect) {
              // Fallback to detect() which is the standard COCO-SSD API
              // Optimized for speed:
              // - maxNumBoxes: 50 (balanced detection count)
              // - scoreThreshold: 0.2 (balanced threshold for speed)
              console.log('Using detect API with fast detection');
              predictions = await model.detect(inputCanvas, 50, 0.2);
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

            // Furniture to exclude from highlighting
            const furnitureToKeep = [
              'chair', 'couch', 'bed', 'dining table', 'toilet', 'tv', 'sink', 'oven', 'refrigerator',
              'microwave', 'bench', 'potted plant', 'clock', 'vase', 'wall', 'door', 'window', 'ceiling',
              'floor', 'curtain', 'lamp', 'light', 'table'
            ];

            // Draw boxes ONLY for items that should be removed
            predictions.forEach(prediction => {
              const [x, y, width, height] = prediction.bbox;
              const score = prediction.score.toFixed(3);
              const className = prediction.class.toLowerCase();
              
              // Skip furniture items completely
              const isFurniture = furnitureToKeep.some(furniture => 
                className.includes(furniture) || furniture.includes(className)
              );
              
              if (isFurniture) {
                return; // Don't draw boxes for furniture
              }
              
              // Check if it's a known removal item
              const isKnownItem = easyToRemoveItems.some(item => 
                className.includes(item) || item.includes(className)
              );
              
              // All non-furniture items get highlighted (known = blue, unknown = red)
              const boxColor = isKnownItem ? '#2563eb' : '#ef4444';
              const labelColor = isKnownItem ? '#2563eb' : '#ef4444';

              // Draw box
              ctx.strokeStyle = boxColor;
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, width, height);

              // Draw label background
              ctx.fillStyle = labelColor;
              const text = `${prediction.class} ${(score * 100).toFixed(0)}%`;
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

export default ObjectDetector;
