import React, { useState } from "react";

// 1. Setup the Image Sources
const TOTAL_IMAGES = 24; 
const CINDERELLA_IMAGES = Array.from({ length: TOTAL_IMAGES }, (_, i) => 
  `${process.env.PUBLIC_URL || ""}/Cinderella/${i + 1}.jpg`
);

const CinderellaViewer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === CINDERELLA_IMAGES.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? CINDERELLA_IMAGES.length - 1 : prevIndex - 1
    );
  };

  // --- STYLES ---
  
  // 1. The Dark Background
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    zIndex: 9998,
    display: isOpen ? 'block' : 'none'
  };

  // 2. The White Modal Box (FIXED SIZE)
  const modalStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)', 
    zIndex: 9999,
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    alignItems: 'center',
    
    // --- KEY FIX: LOCKED DIMENSIONS ---
    width: '1000px',        // Fixed width
    maxWidth: '95vw',       // But shrink on mobile
    height: '80vh',         // Fixed height (NO JUMPING)
    maxHeight: '900px',     // Cap the height on giant screens
    
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    border: '1px solid #ddd',
  };

  return (
    <>
      {/* Trigger Button */}
      <div style={{ marginBottom: '20px',
        display: 'flex',           // Enables Flexbox
        justifyContent: 'center'   // Centers horizontally
       }}>
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            padding: '12px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#008080', 
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          📖 View Cinderella Story
        </button>
      </div>

      {/* Overlay */}
      <div style={overlayStyle} onClick={() => setIsOpen(false)} />

      {/* Modal */}
      <div style={modalStyle}>
          
        {/* Close Button*/}
        <button 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '15px',      
            right: '15px',    
            width: '32px',     
            height: '32px',    
            backgroundColor: '#ef4444', 
            color: 'white',    
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 10,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
          title="Close"
        >
          &#10005; {/* The X symbol */}
        </button>

        {/* Header */}
        <div style={{ 
          marginBottom: '10px', 
          fontSize: '20px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          Page {currentIndex + 1} of {TOTAL_IMAGES}
        </div>
        
        {/* --- IMAGE AREA (The Magic Part) --- */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%', 
          height: '100%',  // Fill the remaining space
          overflow: 'hidden' // Hide anything sticking out
        }}>
          
          {/* Left Arrow */}
          <button 
            onClick={handlePrev}
            style={{ fontSize: '3rem', padding: '0 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#666', transition: 'color 0.2s' }}
            onMouseOver={(e) => e.target.style.color = 'black'}
            onMouseOut={(e) => e.target.style.color = '#666'}
          >
            &#10094;
          </button>

          {/* The Image Wrapper (Centers the image) */}
          <div style={{ 
            flex: 1, 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            <img 
              src={CINDERELLA_IMAGES[currentIndex]} 
              alt={`Story page ${currentIndex + 1}`}
              style={{ 
                // FIT LOGIC:
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain', // Ensures it never stretches/distorts
                borderRadius: '4px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
          </div>

          {/* Right Arrow */}
          <button 
            onClick={handleNext}
            style={{ fontSize: '3rem', padding: '0 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#666', transition: 'color 0.2s' }}
            onMouseOver={(e) => e.target.style.color = 'black'}
            onMouseOut={(e) => e.target.style.color = '#666'}
          >
            &#10095;
          </button>
        </div>

      </div>
    </>
  );
};

export default CinderellaViewer;