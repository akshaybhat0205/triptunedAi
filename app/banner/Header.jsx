import React from 'react';
import Image from 'next/image';
import  "./HomeBanner.css";
const Header = () => (
  <header className="bg-transparent  header-content w-full">
    <div className="px-4 flex items-center justify-between">
      <Image src="/file.png" alt="Image Identifier Logo" width={60} height={60} className="mr-3" />
      <nav className='md:mr-4'>
        <ul className="flex space-x-4">
          {['Home', 'How It Works', 'Features'].map((item, index) => (
            <li key={index}>
              <a
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-white hover:text-secondary transition duration-150 ease-in-out"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
);

export default Header;
