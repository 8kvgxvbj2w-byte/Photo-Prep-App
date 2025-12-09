import React from 'react';
import './RemovalList.css';

function RemovalList({ recommendations, totalDetected }) {
  return (
    <div className="removal-list">
      <div className="list-card">
        <h2>🚫 Items to Remove</h2>
        
        <div className="list-content">
          {recommendations.length > 0 ? (
            <>
              <div className="list-summary">
                <span className="badge-warning">
                  {recommendations.length} of {totalDetected}
                </span>
                <p>objects should be removed for better real estate photos</p>
              </div>

              <ul className="removal-items">
                {recommendations.map((item, idx) => (
                  <li key={idx} className="removal-item">
                    <div className="item-header">
                      <span className="item-name">{item.name}</span>
                      <span className="item-confidence">{item.confidence}%</span>
                    </div>
                    <p className="item-location">Location: ({item.location})</p>
                  </li>
                ))}
              </ul>

              <div className="tips">
                <h3>💡 Tips for Real Estate Photos</h3>
                <ul>
                  <li>Remove personal items (photos, awards, decorations)</li>
                  <li>Clear clutter and extra furniture</li>
                  <li>Remove pets or ensure they're not visible</li>
                  <li>Hide sports equipment and outdoor gear</li>
                  <li>Take photos during daylight hours</li>
                  <li>Use neutral styling for maximum appeal</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>📸 Capture a photo to analyze objects</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RemovalList;
