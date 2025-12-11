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
        // Load the model
        const model = await cocoSsd.load();
        console.log('Model loaded successfully');

        // Get image dimensions
        const img = imgRef.current;
        if (!img.complete) {
          console.log('Image not loaded yet, waiting...');
          img.onload = () => runDetection();
          return;
        }

        const runDetection = async () => {
          console.log('Running detection on image:', img.width, 'x', img.height);
          // Run detection
          const predictions = await model.estimateObjects(img);
          console.log('Predictions received:', predictions);

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
        console.error('Detection error:', err);
        setError('Failed to detect objects. Please try again.\n' + err.message);
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
