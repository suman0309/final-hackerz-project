'use client';

import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import ReactMarkdown from 'react-markdown';
import DragonAnimation from './components/DragonAnimation';
import RocketImage from './components/RocketImage';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_AUDIO_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

// Model configurations
const TEXT_MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const SPEECH_MODEL = 'whisper-large-v3-turbo';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [error, setError] = useState<string | null>(null);
  const [groqApiKey, setGroqApiKey] = useState<string | null>(process.env.NEXT_PUBLIC_GROQ_API_KEY || null);
  const [openaiApiKey, setOpenaiApiKey] = useState<string | null>(process.env.NEXT_PUBLIC_OPENAI_API_KEY || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('identify'); // 'identify', 'extract', 'search'
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get API keys from environment variables
  useEffect(() => {
    const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!groqKey) {
      setError('Groq API key is missing. Please check your environment variables.');
    } else {
      setGroqApiKey(groqKey);
    }
    
    if (!openaiKey) {
      setError('OpenAI API key is missing. Please check your environment variables.');
    } else {
      setOpenaiApiKey(openaiKey);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groqApiKey) {
      setError('Groq API key is missing. Please check your environment variables.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: TEXT_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful learning assistant that provides clear, concise explanations and examples.',
            },
            {
              role: 'user',
              content: input,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
        );
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        setResponse(data.choices[0].message.content || 'No response generated');
      } else {
        setResponse('No response generated. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setResponse('');
    } finally {
      setIsLoading(false);
    }
  };

  const captureImage = async () => {
    if (!groqApiKey) {
      setError('Groq API key is missing. Please check your environment variables.');
      return;
    }

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      setError('Failed to capture image from camera.');
      return;
    }

    setCapturedImage(imageSrc);
    setIsAnalyzing(true);
    setError(null);
    setResponse('Analyzing image...');

    try {
      let systemPrompt = '';
      let userPrompt = '';

      // Set different prompts based on the analysis mode
      switch (analysisMode) {
        case 'identify':
          systemPrompt = 'You are a powerful visual analysis assistant. Analyze the image and describe what you see in detail. Identify objects, people, text, and any other relevant information. Provide educational insights about what is visible. Be specific and detailed in your analysis.';
          userPrompt = 'Please analyze this image and tell me what you see. What objects are present? What can I learn from this image?';
          break;
        case 'extract':
          systemPrompt = 'You are a text extraction specialist. Extract and transcribe ALL text visible in the image. Format the extracted text clearly, preserving any structure, headings, or formatting you can infer. If there is no text, say "No text detected in the image."';
          userPrompt = 'Extract and transcribe all text visible in this image.';
          break;
        case 'search':
          systemPrompt = 'You are a visual search assistant. Identify the main objects, text, or concepts in the image, then search the web for relevant information about them. Provide a comprehensive analysis that combines what you see with web-sourced information. Include educational insights and interesting facts.';
          userPrompt = 'Identify what you see in this image and search for relevant information about it. Provide educational insights and interesting facts.';
          break;
        default:
          systemPrompt = 'You are a helpful visual analysis assistant. Analyze the image and describe what you see in detail.';
          userPrompt = 'Please analyze this image and tell me what you see.';
      }

      // Send the image to Groq's API for analysis
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: VISION_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageSrc
                  }
                }
              ]
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
          stream: false,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(
          `API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
        );
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        setResponse(data.choices[0].message.content || 'No analysis generated');
      } else {
        setResponse('No analysis generated. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setResponse('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetCapture = () => {
    setCapturedImage(null);
    setResponse('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioSubmit = async () => {
    if (!audioBlob) {
      setError('No audio recorded. Please record some audio first.');
      return;
    }

    if (!groqApiKey) {
      setError('Groq API key is missing. Please check your environment variables (NEXT_PUBLIC_GROQ_API_KEY).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, transcribe the audio using Groq's Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', SPEECH_MODEL);
      formData.append('language', 'en');
      formData.append('response_format', 'json');

      const transcriptionResponse = await fetch(GROQ_AUDIO_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json().catch(() => ({}));
        console.error('Transcription Error:', errorData);
        throw new Error(`Failed to transcribe audio: ${errorData.error?.message || 'Unknown error'}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcribedText = transcriptionData.text;

      // Now use the transcribed text with Groq
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: TEXT_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful learning assistant that provides clear, concise explanations and examples.'
            },
            {
              role: 'user',
              content: transcribedText
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
        );
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        setResponse(data.choices[0].message.content || 'No response generated');
      } else {
        setResponse('No response generated. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setResponse('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setIsLaunching(true);
    setActiveTab(tab);
    setTimeout(() => setIsLaunching(false), 800);
  };

  // Button click handlers
  const handleStartLearning = () => {
    setActiveTab('text');
    setIsLaunching(true);
    setTimeout(() => setIsLaunching(false), 800);
  };

  const handleViewResources = () => {
    setShowFeatures(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleContactUs = () => {
    setShowContact(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleFeatureClick = (feature: string) => {
    setActiveTab('text');
    setInput(`Tell me about ${feature}`);
    setIsLaunching(true);
    setTimeout(() => setIsLaunching(false), 800);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
      
      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 animate-gradient"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-1 h-1 bg-white rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
              opacity: 0.3 + Math.random() * 0.7
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500 animate-gradient">
            Welcome to AI Learning Assistant
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Your personal AI tutor for interactive learning
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Get Started Section */}
          <div 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 card-3d"
          >
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Get Started</h2>
            <p className="text-gray-300 mb-6">
              Begin your learning journey with our interactive AI tutor
            </p>
            <button 
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity glow"
              onClick={handleStartLearning}
            >
              Start Learning
            </button>
          </div>

          {/* Resources Section */}
          <div 
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 card-3d"
          >
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Resources</h2>
            <p className="text-gray-300 mb-6">
              Access learning materials and study resources
            </p>
            <button 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity glow"
              onClick={handleViewResources}
            >
              View Resources
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
              Key Features
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div 
              className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 card-3d cursor-pointer"
              onClick={() => handleFeatureClick('AI-powered learning')}
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">AI-Powered Learning</h3>
              <p className="text-gray-400">Get personalized explanations and answers to your questions using advanced AI technology.</p>
            </div>
            
            {/* Feature 2 */}
            <div 
              className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105 card-3d cursor-pointer"
              onClick={() => handleFeatureClick('visual learning')}
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-300">Visual Learning</h3>
              <p className="text-gray-400">Upload images or use your camera to get AI analysis and explanations of visual content.</p>
            </div>
            
            {/* Feature 3 */}
            <div 
              className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 transform hover:scale-105 card-3d cursor-pointer"
              onClick={() => handleFeatureClick('voice interaction')}
            >
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-pink-300">Voice Interaction</h3>
              <p className="text-gray-400">Speak your questions and get responses through voice recognition technology.</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === 'text'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => handleTabChange('text')}
            >
              Text
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === 'image'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => handleTabChange('image')}
            >
              Image
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === 'voice'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => handleTabChange('voice')}
            >
              Voice
            </button>
          </div>

          {/* Text Input */}
          {activeTab === 'text' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full h-32 bg-gray-900/50 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? 'Thinking...' : 'Ask Question'}
                </button>
              </form>
            </div>
          )}

          {/* Image Analysis */}
          {activeTab === 'image' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
              <div className="space-y-4">
                <div className="flex space-x-4 mb-4">
                  <button
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      analysisMode === 'identify'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setAnalysisMode('identify')}
                  >
                    Identify
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      analysisMode === 'extract'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setAnalysisMode('extract')}
                  >
                    Extract Text
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      analysisMode === 'search'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => setAnalysisMode('search')}
                  >
                    Search
                  </button>
                </div>

                <div className="relative">
                  {!capturedImage ? (
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="relative">
                      <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-full rounded-lg"
                      />
                      <button
                        onClick={resetCapture}
                        className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={captureImage}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
                </button>
              </div>
            </div>
          )}

          {/* Voice Input */}
          {activeTab === 'voice' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-6 py-3 rounded-full transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500 text-white'
                        : 'bg-pink-500 text-white hover:bg-pink-600'
                    }`}
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                </div>

                {audioBlob && (
                  <div className="space-y-4">
                    <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
                    <button
                      onClick={handleAudioSubmit}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Submit Audio'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Response Area */}
          {(response || error) && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                  {error}
                </div>
              )}
              {response && (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{response}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">AI Learning Assistant</h3>
              <p className="text-gray-400 mb-4">Your personal AI tutor for interactive learning and knowledge exploration.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-pink-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors" onClick={(e) => { e.preventDefault(); setShowFeatures(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}>Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors" onClick={(e) => { e.preventDefault(); handleViewResources(); }}>Resources</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-400 transition-colors" onClick={(e) => { e.preventDefault(); setActiveTab('text'); setInput('Tell me about this AI Learning Assistant'); }}>About Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Contact</h3>
              <p className="text-gray-400 mb-2">Have questions or feedback?</p>
              <p className="text-gray-400 mb-4">Email us at <a href="mailto:info@ailearning.com" className="text-purple-400 hover:text-purple-300">info@ailearning.com</a></p>
              <button 
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                onClick={handleContactUs}
              >
                Contact Us
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} AI Learning Assistant. All rights reserved.</p>
          </div>
        </footer>

        {/* Dragon Animation */}
        <div className="fixed bottom-0 right-0 p-8">
          <DragonAnimation />
        </div>
      </div>
    </main>
  );
}