'use client';

import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import ReactMarkdown from 'react-markdown';
import DragonAnimation from './components/DragonAnimation';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('identify'); // 'identify', 'extract', 'search'
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get API key from environment variable
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!key) {
      setError('API key is missing. Please check your environment variables.');
    } else {
      setApiKey(key);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      setError('API key is missing. Please check your environment variables.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
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
    if (!apiKey) {
      setError('API key is missing. Please check your environment variables.');
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
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
          max_tokens: 4096,
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

    setIsLoading(true);
    setError(null);

    try {
      // First, transcribe the audio using Whisper
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'en');
      formData.append('response_format', 'json');

      const transcriptionResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`,
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
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
          max_tokens: 4096,
          top_p: 0.9,
          stream: false,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
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

  // Add mouse tracking for 3D card effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
  };

  const handleTabChange = (tab: string) => {
    setIsLaunching(true);
    setActiveTab(tab);
    setTimeout(() => setIsLaunching(false), 800);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-40 relative z-10">
      <h1 className="text-4xl font-bold text-center mb-8 text-glow float">
        <span className="bg-gradient-to-r from-violet-600 via-red-600 to-pink-300 bg-clip-text text-transparent">
          Skillsnap
        </span>
      </h1>
      <h2 className="text-xl text-center mb-8 text-gray-300 animate-fade-in">
        A Groq-Powered Career Builder
      </h2>
      
      <div className="flex space-x-4 mb-6 justify-center">
        <button
          className={`btn-primary glow ${activeTab === 'text' ? 'from-violet-600 to-red-600 shadow-violet-500/40' : ''} hover-3d`}
          onClick={() => handleTabChange('text')}
        >
          Text Input
        </button>
        <button
          className={`btn-primary glow ${activeTab === 'vision' ? 'from-violet-600 to-red-600 shadow-violet-500/40' : ''} hover-3d`}
          onClick={() => handleTabChange('vision')}
        >
          Visual Learning
        </button>
        <button
          className={`btn-primary glow ${activeTab === 'audio' ? 'from-violet-600 to-red-600 shadow-violet-500/40' : ''} hover-3d`}
          onClick={() => handleTabChange('audio')}
        >
          Voice Input
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div 
          className="card card-3d bg-black/80 border-violet-500/20"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {activeTab === 'text' && (
            <form onSubmit={handleSubmit} className={`animate-fade-in ${isLaunching ? 'launch-text launch-trail' : ''}`}>
              <textarea
                className="input-field h-32 mb-4 bg-black/50 border-violet-500/30 focus:border-pink-300/50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your learning question here..."
              />
              <button 
                type="submit" 
                className="btn-primary w-full glow hover-3d from-violet-600 to-red-600" 
                disabled={isLoading || !apiKey}
              >
                {isLoading ? 'Processing...' : 'Get Answer'}
              </button>
            </form>
          )}

          {activeTab === 'vision' && (
            <div className={`animate-fade-in ${isLaunching ? 'launch-visual launch-trail' : ''}`}>
              {!capturedImage ? (
                <>
                  <div className="flex space-x-2 mb-4 justify-center">
                    <button
                      className={`btn-primary text-sm glow ${analysisMode === 'identify' ? 'from-violet-600 to-red-600' : ''} hover-3d`}
                      onClick={() => setAnalysisMode('identify')}
                    >
                      Identify Objects
                    </button>
                    <button
                      className={`btn-primary text-sm glow ${analysisMode === 'extract' ? 'from-violet-600 to-red-600' : ''} hover-3d`}
                      onClick={() => setAnalysisMode('extract')}
                    >
                      Extract Text
                    </button>
                    <button
                      className={`btn-primary text-sm glow ${analysisMode === 'search' ? 'from-violet-600 to-red-600' : ''} hover-3d`}
                      onClick={() => setAnalysisMode('search')}
                    >
                      Web Search
                    </button>
                  </div>
                  <div className="relative mb-4 rounded-lg overflow-hidden border-glow">
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full rounded-lg"
                      videoConstraints={{
                        facingMode: "user",
                        width: 1280,
                        height: 720
                      }}
                      screenshotQuality={0.92}
                      mirrored={true}
                    />
                    <div className="absolute inset-0 pointer-events-none border-2 border-violet-500/30 rounded-lg"></div>
                    {isAnalyzing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="text-white text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mx-auto mb-2"></div>
                          <p>Analyzing image...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn-primary w-full glow hover-3d from-violet-600 to-red-600" 
                    onClick={captureImage}
                    disabled={isAnalyzing || !apiKey}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    {isAnalyzing ? 'Analyzing...' : 'Capture and Analyze'}
                  </button>
                </>
              ) : (
                <div className="relative mb-4 rounded-lg overflow-hidden border-glow">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full rounded-lg"
                  />
                  <div className="absolute inset-0 pointer-events-none border-2 border-violet-500/30 rounded-lg"></div>
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <button 
                      className="btn-primary text-sm glow hover-3d from-violet-600 to-red-600" 
                      onClick={resetCapture}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Reset
                    </button>
                    <button 
                      className="btn-primary text-sm glow hover-3d from-violet-600 to-red-600" 
                      onClick={captureImage}
                      disabled={isAnalyzing || !apiKey}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Reanalyze
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className={`space-y-4 animate-fade-in ${isLaunching ? 'launch-audio launch-trail' : ''}`}>
              <div className="flex justify-center space-x-4">
                <button
                  className={`btn-primary glow ${isRecording ? 'from-red-600 to-violet-600' : 'from-violet-600 to-red-600'}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
                <button
                  className="btn-primary glow from-violet-600 to-red-600"
                  onClick={handleAudioSubmit}
                  disabled={!audioBlob || isLoading}
                >
                  {isLoading ? 'Processing...' : 'Submit Audio'}
                </button>
              </div>
              {audioBlob && (
                <div className="mt-4">
                  <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
                </div>
              )}
            </div>
          )}
        </div>

        <div 
          className="card card-3d bg-black/80 border-violet-500/20"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <h2 className="text-2xl font-semibold mb-4">
            <span className="bg-gradient-to-r from-violet-600 via-red-600 to-pink-300 bg-clip-text text-transparent">
              Response
            </span>
          </h2>
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-4 animate-fade-in">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          <div className="prose prose-invert max-w-none">
            {response ? (
              <ReactMarkdown className={`animate-fade-in ${isLaunching ? 'launch-animation' : ''}`}>{response}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic animate-fade-in">
                {isLoading || isAnalyzing ? 'Processing...' : 'No response yet. Ask a question or capture an image to get started.'}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <DragonAnimation />
    </div>
  );
}