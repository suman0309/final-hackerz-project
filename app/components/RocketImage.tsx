'use client';

import { useState } from 'react';

export default function RocketImage() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative w-24 h-24 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rocket Body */}
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-16
        bg-gradient-to-b from-gray-700 to-gray-900 rounded-t-lg
        transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
        {/* Windows */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-400 rounded-full"></div>
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-400 rounded-full"></div>
      </div>

      {/* Rocket Fins */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-4">
        <div className="absolute left-0 w-4 h-4 bg-red-500 transform rotate-45"></div>
        <div className="absolute right-0 w-4 h-4 bg-red-500 transform -rotate-45"></div>
      </div>

      {/* Rocket Flame */}
      <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2
        transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="w-4 h-8 bg-gradient-to-t from-orange-500 to-red-500 rounded-b-full"></div>
      </div>
    </div>
  );
} 