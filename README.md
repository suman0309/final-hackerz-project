# Smart Learning Assistant

A multimodal learning platform that leverages Groq's high-performance AI capabilities to provide an interactive and engaging learning experience. The application supports text, voice, and visual learning modalities.

## Features

- **Text-based Learning**: Ask questions and get detailed explanations
- **Voice Input**: Speak your questions and get responses
- **Visual Learning**: Capture images for analysis and learning
- **Real-time Responses**: Fast and accurate AI-powered responses
- **Modern UI**: Clean and intuitive user interface

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Groq API key

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smart-learning-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add your Groq API key:
   ```
   NEXT_PUBLIC_GROQ_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Text Input**: Type your question in the text area and click "Get Answer"
2. **Voice Input**: Click "Start Listening" and speak your question
3. **Visual Learning**: Use your camera to capture images for analysis

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Groq AI SDK
- React Webcam
- React Speech Recognition

## Contributing

Feel free to submit issues and pull requests.

## License

MIT 