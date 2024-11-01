import React from "react";
import Image from "next/image";
import "./HomeBanner.css";

const Header = ({ scrollToHome, scrollToFeatures, scrollToExplore }) => {
  const handleScroll = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="bg-transparent header-content w-full">
      <div className="px-4 flex items-center justify-between">
        <Image
          src="/file.png"
          alt="Image Identifier Logo"
          width={60}
          height={60}
          className="mr-3"
        />
        <nav className="md:mr-4">
          {/* <ul className="flex space-x-4">
            <li>
              <button
                onClick={() => handleScroll(scrollToHome)}
                className="text-white hover:text-secondary transition duration-150 ease-in-out"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => handleScroll(scrollToExplore)}
                className="text-white hover:text-secondary transition duration-150 ease-in-out"
              >
                Explore
              </button>
            </li>
            <li>
              <button
                onClick={() => handleScroll(scrollToFeatures)}
                className="text-white hover:text-secondary transition duration-150 ease-in-out"
              >
                Features
              </button>
            </li>
          </ul> */}
          <p className="text-2xl md:text-2xl font-bold mb-4 mt-2 astoria-font tracking-wider">
            Explore with <span className="text-secondary">AI</span>
          </p>
        </nav>
      </div>
    </header>
  );
};

export default Header;
