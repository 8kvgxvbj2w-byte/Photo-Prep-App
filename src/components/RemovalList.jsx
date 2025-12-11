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
                  <li key={idx} className={`removal-item ${item.type === 'styling' ? 'styling-tips-item' : ''}`}>
                    {item.type === 'styling' ? (
                      // Styling tips section
                      <div className="styling-section">
                        <div className="item-header">
                          <span className="item-name styling-title">{item.name}</span>
                        </div>
                        <ul className="styling-tips-list">
                          {item.tips.map((tip, tipIdx) => (
                            <li key={tipIdx} className="styling-tip">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      // Regular removal item
                      <>
                        <div className="item-header">
                          <span className="item-name">{item.name}</span>
                          <span className="item-confidence">{item.confidence}%</span>
                        </div>
                        {item.reason && (
                          <p className="item-reason">💡 {item.reason}</p>
                        )}
                        {item.category && (
                          <p className="item-category">{item.category}</p>
                        )}
                        <p className="item-location">Location: ({item.location})</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
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
