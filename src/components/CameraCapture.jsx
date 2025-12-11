import React, { useRef, useState } from 'react';
import './CameraCapture.css';

function CameraCapture({ onCapture, image }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      console.log('Camera stream acquired:', stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Video ref set, playing...');
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      const errorMsg = `Camera Error: ${err.name} - ${err.message}`;
      setCameraError(errorMsg);
      alert('Unable to access camera. Please check permissions.\n\n' + errorMsg);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      const imageSrc = canvasRef.current.toDataURL('image/jpeg');
      
      onCapture(imageSrc);
      stopCamera();
    }
  };

  const uploadPhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onCapture(event.target.result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="camera-capture">
      <div className="camera-card">
        <h2>📷 Capture Room</h2>
        
        {!image ? (
          <>
            {cameraError && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#ffebee', 
                color: '#c62828', 
                borderRadius: '4px', 
                marginBottom: '10px',
                fontSize: '12px'
              }}>
                {cameraError}
              </div>
            )}
            {!isCameraActive ? (
              <div className="camera-placeholder">
                <p>Ready to capture your room</p>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                className="camera-video"
              />
            )}
            
            <div className="camera-controls">
              {!isCameraActive ? (
                <>
                  <button 
                    className="btn btn-primary" 
                    onClick={startCamera}
                  >
                    Start Camera
                  </button>
                  <label className="btn btn-secondary">
                    Upload Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={uploadPhoto}
                      style={{ display: 'none' }}
                    />
                  </label>
                </>
              ) : (
                <>
                  <button 
                    className="btn btn-success" 
                    onClick={capturePhoto}
                  >
                    Capture Photo
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={stopCamera}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <img src={image} alt="Captured" className="camera-preview" />
            <div className="camera-controls">
              <button 
                className="btn btn-secondary" 
                onClick={() => onCapture(null)}
              >
                Take Another Photo
              </button>
            </div>
          </>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default CameraCapture;
