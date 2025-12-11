import React, { useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import './ObjectDetector.css';

function ObjectDetector({ image, onDetectionComplete, detectedObjects }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (!image) return;

    const detectObjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('Image received, loading model...');
        console.log('Image data length:', image.length);
        
        // Load the model with a timeout
        const modelPromise = cocoSsd.load();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Model loading timeout after 30 seconds')), 30000)
        );
        
        const model = await Promise.race([modelPromise, timeoutPromise]);
        console.log('Model loaded successfully, model object keys:', Object.keys(model));

        // Get image dimensions
        const img = imgRef.current;
        if (!img.complete) {
          console.log('Image not loaded yet, waiting for onload...');
          img.onload = () => {
            console.log('Image loaded, dimensions:', img.width, 'x', img.height);
            runDetection();
          };
          return;
        }
        
        console.log('Image already loaded, dimensions:', img.width, 'x', img.height);

        const runDetection = async () => {
          console.log('Running detection on image:', img.width, 'x', img.height);
          // Run detection - use detect() instead of estimateObjects()
          let predictions;
          try {
            // Try the newer API first
            if (model.estimateObjects) {
              console.log('Using estimateObjects API');
              predictions = await model.estimateObjects(img);
            } else if (model.detect) {
              // Fallback to detect() which is the standard COCO-SSD API
              console.log('Using detect API');
              predictions = await model.detect(img);
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
            
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Draw boxes
            predictions.forEach(prediction => {
              const [x, y, width, height] = prediction.bbox;
              const score = prediction.score.toFixed(3);

              // Draw box
              ctx.strokeStyle = '#00ff00';
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y, width, height);

              // Draw label
              ctx.fillStyle = '#00ff00';
              ctx.font = 'bold 14px Arial';
              ctx.fillText(
                `${prediction.class} ${(score * 100).toFixed(0)}%`,
                x,
                y - 5
              );
            });
            console.log('Canvas drawn with', predictions.length, 'predictions');
          }
        };

        await runDetection();
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
