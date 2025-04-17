'use client';

import { useState, useEffect, useRef } from 'react';

const questions = [
  "What would you like to learn today?",
  "Do you have any questions about science?",
  "Would you like to explore history?",
  "How about learning something new?",
  "What's on your mind today?",
  "Need help with a problem?",
  "Let's discover something amazing!",
  "What interests you the most?",
  "Ready for an adventure in learning?",
  "What would you like to know more about?"
];

export default function DragonAnimation() {
  const [currentQuestion, setCurrentQuestion] = useState(questions[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isBreathingFire, setIsBreathingFire] = useState(false);
  const [fireBalls, setFireBalls] = useState<{ id: number; targetX: number; targetY: number }[]>([]);
  const dragonRef = useRef<HTMLDivElement>(null);
  const fireBallCounter = useRef(0);

  useEffect(() => {
    // Change question every 5 seconds
    const questionInterval = setInterval(() => {
      setShowBubble(false);
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * questions.length);
        setCurrentQuestion(questions[randomIndex]);
        setShowBubble(true);
      }, 500);
    }, 5000);

    // Start with the bubble visible
    setShowBubble(true);

    return () => clearInterval(questionInterval);
  }, []);

  // Start wing animation when mouse is over the dragon
  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsAnimating(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsAnimating(false);
  };

  const throwFire = (event: MouseEvent) => {
    if (!dragonRef.current) return;

    const dragonRect = dragonRef.current.getBoundingClientRect();
    const dragonX = dragonRect.left + dragonRect.width / 2;
    const dragonY = dragonRect.top + dragonRect.height / 2;

    const targetX = event.clientX - dragonX;
    const targetY = event.clientY - dragonY;

    const newFireBall = {
      id: fireBallCounter.current++,
      targetX,
      targetY,
    };

    setFireBalls(prev => [...prev, newFireBall]);
    setIsBreathingFire(true);

    setTimeout(() => {
      setFireBalls(prev => prev.filter(ball => ball.id !== newFireBall.id));
      setIsBreathingFire(false);
    }, 1000);
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('button')) {
        throwFire(event);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="fixed bottom-0 right-0 h-60 w-60 flex justify-end items-end z-10">
      {/* Speech bubble */}
      {showBubble && (
        <div className="absolute bottom-32 right-20 bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-xs animate-fade-in border border-violet-500/30 shadow-violet-500/20">
          <div className="text-center text-white font-medium">{currentQuestion}</div>
          <div className="absolute bottom-0 right-4 transform translate-y-2">
            <div className="w-0 h-0 border-t-8 border-gray-900/90 border-r-8 border-l-8 border-transparent"></div>
          </div>
        </div>
      )}
      
      {/* Dragon */}
      <div 
        ref={dragonRef}
        className={`relative w-48 h-48 cursor-pointer animate-dragon-breathe ${isBreathingFire ? 'breathing-fire' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Dragon body */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-36 h-24 bg-gradient-to-r from-violet-600 to-violet-800 rounded-full shadow-lg shadow-violet-500/30"></div>
        
        {/* Dragon head */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-24 h-18 bg-gradient-to-r from-violet-500 to-violet-700 rounded-full shadow-md shadow-violet-500/20"></div>
        
        {/* Dragon eyes */}
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 -translate-y-1 w-6 h-6 bg-red-400 rounded-full shadow-inner shadow-red-500/50"></div>
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 translate-x-3 -translate-y-1 w-6 h-6 bg-red-400 rounded-full shadow-inner shadow-red-500/50"></div>
        
        {/* Dragon pupils */}
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 -translate-y-1 w-3 h-3 bg-black rounded-full"></div>
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 translate-x-3 -translate-y-1 w-3 h-3 bg-black rounded-full"></div>
        
        {/* Dragon wings */}
        <div className={`absolute bottom-12 left-1/2 transform -translate-x-1/2 -translate-y-1 w-24 h-12 bg-gradient-to-r from-violet-400 to-violet-600 rounded-full shadow-md shadow-violet-500/20 ${isAnimating ? 'animate-wing-flap' : ''}`}></div>
        
        {/* Dragon tail */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 translate-x-12 w-18 h-6 bg-gradient-to-r from-violet-700 to-violet-900 rounded-full shadow-md shadow-violet-500/20"></div>
        
        {/* Fire effect when hovered */}
        {isHovered && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-3 w-6 h-12">
            <div className="w-full h-full bg-gradient-to-t from-red-600 via-red-500 to-transparent rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
          </div>
        )}
      </div>
      {fireBalls.map(ball => (
        <div
          key={ball.id}
          className="dragon-fire-throw"
          style={{
            '--target-x': `${ball.targetX}px`,
            '--target-y': `${ball.targetY}px`,
          } as React.CSSProperties}
        >
          <div className="fire-ball" style={{ animation: 'throwFire 1s ease-out forwards' }}></div>
        </div>
      ))}
    </div>
  );
} 