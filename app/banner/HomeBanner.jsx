import React from 'react';
import './HomeBanner.css'; // For the CSS styles

function HomeBanner() {
  return (
    <div className="banner">
      <img src="./home-banner.jpeg" alt="Banner" className="banner-image" />
      <div className="overlay"></div>
      <div className="content">
        <h1 className='text-white font-bold astoria-font text-5xl'>Your Banner Text</h1>
      </div>
    </div>
  );
}

export default HomeBanner;
