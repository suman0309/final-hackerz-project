'use client';

import { useState, useEffect } from 'react';

export default function RocketLaunch() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    // Start the launch sequence after a short delay
    const launchTimer = setTimeout(() => {
      setIsLaunching(true);
      
      // Complete the launch after animation
      const completeTimer = setTimeout(() => {
        setIsLaunched(true);
        
        // Hide the rocket after it's launched
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
        }, 1000);
        
        return () => clearTimeout(hideTimer);
      }, 2000);
      
      return () => clearTimeout(completeTimer);
    }, 1000);
    
    return () => clearTimeout(launchTimer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Title */}
        <div className={`text-4xl md:text-6xl font-bold mb-8 text-center transition-all duration-1000 ${isLaunching ? 'opacity-0 transform -translate-y-20' : 'opacity-100'}`}>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-red-400">
            Skillsnap
          </span>
          <div className="text-xl md:text-2xl mt-2 text-gray-300">
            A Groq-Powered Career Builder
          </div>
        </div>
        
        {/* Rocket */}
        <div className={`relative transition-all duration-1000 ${isLaunching ? 'transform -translate-y-96 opacity-0' : 'transform translate-y-0 opacity-100'}`}>
          {/* Rocket body */}
          <div className="w-16 h-32 bg-gradient-to-b from-gray-300 to-gray-500 rounded-t-full relative">
            {/* Rocket window */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-blue-400 rounded-full border-2 border-blue-600"></div>
            
            {/* Rocket fins */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <div className="w-4 h-8 bg-red-500 rounded-t-sm"></div>
              <div className="w-4 h-8 bg-red-500 rounded-t-sm"></div>
              <div className="w-4 h-8 bg-red-500 rounded-t-sm"></div>
            </div>
          </div>
          
          {/* Rocket flame */}
          <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-16 ${isLaunching ? 'animate-rocket-flame' : ''}`}>
            <div className="w-full h-full bg-gradient-to-t from-red-600 via-orange-400 to-yellow-300 rounded-b-full"></div>
          </div>
        </div>
        
        {/* Launch pad */}
        <div className={`mt-4 transition-all duration-1000 ${isLaunching ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-32 h-4 bg-gray-700 rounded-full"></div>
          <div className="w-24 h-2 bg-gray-600 rounded-full mx-auto mt-2"></div>
        </div>
        
        {/* Stars in background */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className={`absolute w-1 h-1 bg-white rounded-full ${isLaunching ? 'animate-twinkle' : ''}`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
        
        {/* Launch message */}
        {isLaunched && (
          <div className="absolute bottom-20 text-2xl font-bold text-white animate-fade-in">
            Launching your career journey...
          </div>
        )}
      </div>
    </div>
  );
} 