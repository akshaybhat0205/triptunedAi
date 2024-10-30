import React, { useState } from "react";
import "./Banner.css"; // Make sure the path is correct

const iconData = [
  {
    src: "https://img.icons8.com/wired/80/FFFFFF/chipping.png",
    alt: "AI-Powered",
    title: "AI-Powered",
    description:
      "Harness the power of AI to bring you personalized insights and recommendations",
  },
  {
    src: "https://img.icons8.com/material-outlined/80/FFFFFF/lightning-bolt--v1.png",
    alt: "Quick Results",
    title: "Quick Results",
    description:
      "Get instant answers to your questions, making exploration effortless and efficient",
  },
  {
    src: "https://img.icons8.com/ios/80/FFFFFF/worldwide-location--v1.png",
    alt: "Globally Usable",
    title: "Globally Usable",
    description:
      "Explore destinations around the globe, no matter where your journey takes you",
  },
  {
    src: "https://img.icons8.com/parakeet-line/80/FFFFFF/add-image.png",
    alt: "Upload Image",
    title: "Upload Image",
    description:
      "Simply upload a photo to reveal the story behind every place you encounter",
  },
  {
    src: "https://img.icons8.com/ios/80/FFFFFF/chatgpt.png",
    alt: "ChatGPT Prompt",
    title: "ChatGPT Prompt",
    description:
      "Engage with an intelligent assistant for dynamic conversations about your travel inquiries",
  },
  {
    src: "https://img.icons8.com/pastel-glyph/80/FFFFFF/search--v2.png",
    alt: "Search",
    title: "Search",
    description:
      "Easily search for places by name or description to unlock a world of discovery",
  },
  {
    src: "https://img.icons8.com/wired/80/FFFFFF/point-objects.png",
    alt: "Nearby Locations",
    title: "Nearby Locations",
    description:
      "Discover attractions and points of interest right at your fingertips, tailored to your location",
  },
  {
    src: "https://img.icons8.com/ios/80/FFFFFF/filter--v1.png",
    alt: "Filter",
    title: "Filter",
    description:
      "Customize your search to match your interests and travel style for a truly personal experience",
  },
];

const IconBlock = ({ src, alt, title, description, onHover, onLeave, onClick }) => (
  <div
    className="icon-block bg-tertiary rounded-full cursor-pointer"
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
    onClick={onClick} // Click functionality for mobile devices
  >
    <img src={src} alt={alt} className="p-2" />
  </div>
);

const Banner = () => {
  const [hoveredInfo, setHoveredInfo] = useState({ title: "", description: "" }); // State to manage hovered or clicked info

  return (
    <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gradient-to-br  md:bg-gradient-to-r from-primary to-slate-800 text-white items-center">
      <div className="col-span-12 xl:col-span-7">
        <p className="text-2xl md:text-6xl font-bold mb-4 astoria-font tracking-wider">
          Snap It, Type It
        </p>
        <p className="text-2xl md:text-6xl font-bold mb-4 astoria-font tracking-wider">
          Explore with <span className="text-secondary">AI</span>
        </p>
        <p className="text-2xl font-medium mt-10 mb-4 astoria-font text-justify text-gray-300">
          Experience the world like never before, using your camera or your
          words. Where Next transforms your photos and text into instant
          insights, revealing the history and hidden gems of every destination.
          Simply snap a picture or type in a location, and let our AI-powered
          app guide your journey to new adventures and discoveries. With Where
          Next, exploration is just a click away!
        </p>
      </div>
      <div className="col-span-12 xl:col-span-5">
        <section className="main-container">
          <div className="main">
            {/* Big Circle */}
            <div className="big-circle">
              {iconData.slice(0, 4).map((icon, index) => (
                <IconBlock
                  key={index}
                  src={icon.src}
                  alt={icon.alt}
                  title={icon.title}
                  description={icon.description}
                  onHover={() => setHoveredInfo({ title: icon.title, description: icon.description })} // Set title and description on hover
                  onLeave={() => setHoveredInfo({ title: "", description: "" })} // Clear info on leaving
                  onClick={() => setHoveredInfo({ title: icon.title, description: icon.description })} // Set title and description on click for mobile
                />
              ))}
            </div>

            {/* Smaller Circle */}
            <div className="circle">
              {iconData.slice(4).map((icon, index) => (
                <IconBlock
                  key={index}
                  src={icon.src}
                  alt={icon.alt}
                  title={icon.title}
                  description={icon.description}
                  onHover={() => setHoveredInfo({ title: icon.title, description: icon.description })} // Set title and description on hover
                  onLeave={() => setHoveredInfo({ title: "", description: "" })} // Clear info on leaving
                  onClick={() => setHoveredInfo({ title: icon.title, description: icon.description })} // Set title and description on click for mobile
                />
              ))}
            </div>

            {/* Center Logo */}
            <div className="center-logo">
              {hoveredInfo.title ? (
                <div className="hovered-info">
                  <h3 className="text-center md:text-3xl md:mb-3 font-bold text-secondary astoria-font">{hoveredInfo.title}</h3>
                  <p className="text-center text-sm md:text-lg tracking-tighter md:tracking-normal">{hoveredInfo.description}</p>
                </div>
              ) : (
                <img src="/file.png" alt="logo" />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Banner;
