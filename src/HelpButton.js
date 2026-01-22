import React, { useState, useRef, useEffect } from "react";

const VIDEO_SOURCES = [
  `${process.env.PUBLIC_URL || ""}/UserGuidePart1.mp4`,
  `${process.env.PUBLIC_URL || ""}/UserGuidePart2.mp4`,
  `${process.env.PUBLIC_URL || ""}/UserGuidePart3.mp4`
];

const HelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);
  const videoRef = useRef(null);

  // When the "Help" button is clicked
  const handleOpen = () => {
    setIsOpen(true);
  };

  // Auto-play the video whenever the window opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
    }
  }, [isOpen]);

  const containerStyle = isOpen
    ? {
        position: 'fixed',
        top: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '1000px',
        maxWidth:'90vw',
        height: 'auto',
        maxHeight:'80vh'
      }
    : {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        width: 'fit-content',
        height: 'auto'
      };

  // When the video finishes playing
  const handleVideoEnded = () => {
    // 1. Close the window
    setIsOpen(false);
    
    // 2. Increment the index for next time (loop back to 0 if at the end)
    setVideoIndex((prevIndex) => (prevIndex + 1) % VIDEO_SOURCES.length);
  };

  return (
    <div className="help-container" style={containerStyle}>
      
      {/* 1. The Trigger Button */}
      {!isOpen && (
        <button 
          onClick={handleOpen}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#183659',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          Help ?
        </button>
      )}

      {/* 2. The Video Window */}
      {isOpen && (
        <div style={{
          position: 'relative', 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          border: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 'fit-content',
          height: 'auto'
        }}>
          
          {/* THE CLOSE 'X' BUTTON */}
          <button 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: '0px',      
              right: '20px',    
              width: '24px',     
              height: '24px',    
              backgroundColor: 'red', 
              color: 'white',    
              border: 'none',
              borderRadius: '4px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            title="Close"
          >
            &#10005;
          </button>

          <div style={{ 
            marginBottom: '10px', 
            fontSize: '16px', 
            color: '#666',
            alignSelf: 'flex-start'
          }}>
            User Guide Part {videoIndex + 1} of {VIDEO_SOURCES.length}
          </div>
          
          <video
            ref={videoRef}
            width="1500"
            controls
            key={VIDEO_SOURCES[videoIndex]} 
            onEnded={handleVideoEnded}
            style={{ 
              display: 'block', 
              borderRadius: '4px',
              maxWidth: '100%',
              height: 'auto',
              aspectRatio: 'auto',
              objectFit: 'contain'
            }}
          >
            <source src={VIDEO_SOURCES[videoIndex]} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default HelpButton;