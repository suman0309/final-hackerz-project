'use client';

import { useState, useEffect } from 'react';

const questions = [
  "What would you like to learn today?",
  "Need help with a specific topic?",
  "Ready to explore something new?",
  "Let's make learning fun! What interests you?",
  "Have a question? I'm here to help!",
  "Time for some brain exercise! What's on your mind?",
  "Curious about something? Ask me anything!",
  "Let's discover something amazing together!"
];

export default function DragonAnimation() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestion((prev) => (prev + 1) % questions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative w-48 h-48 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dragon Body */}
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-32 
        bg-gradient-to-r from-purple-500 to-blue-500 rounded-full
        transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
        {/* Eyes */}
        <div className="absolute top-8 left-8 w-4 h-4 bg-white rounded-full">
          <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full"></div>
        </div>
        <div className="absolute top-8 right-8 w-4 h-4 bg-white rounded-full">
          <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full"></div>
        </div>
        
        {/* Wings */}
        <div className={`absolute top-12 -left-8 w-16 h-12 bg-purple-400 rounded-full
          transform transition-all duration-300 ${isHovered ? 'rotate-45' : 'rotate-0'}`}></div>
        <div className={`absolute top-12 -right-8 w-16 h-12 bg-blue-400 rounded-full
          transform transition-all duration-300 ${isHovered ? '-rotate-45' : 'rotate-0'}`}></div>
      </div>

      {/* Speech Bubble */}
      <div className={`absolute -top-24 left-1/2 transform -translate-x-1/2 
        bg-white p-4 rounded-lg shadow-lg max-w-xs
        transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <p className="text-gray-800 text-sm">{questions[currentQuestion]}</p>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white"></div>
      </div>

      {/* Fire Effect */}
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2
        transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-8 h-12 bg-gradient-to-t from-orange-500 to-red-500 rounded-b-full"></div>
      </div>
    </div>
  );
} 