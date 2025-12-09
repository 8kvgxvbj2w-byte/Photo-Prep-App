# Photo Prep - Real Estate Photo Assistant

A web app that uses your camera to identify objects in rooms and recommends items to remove for better real estate photos.

## Features

- 📸 **Live Camera Capture** - Use your device camera or upload photos
- 🔍 **AI Object Detection** - COCO-SSD model identifies 80+ object types
- 🚫 **Smart Recommendations** - Automatically highlights items to remove for real estate listings
- 📱 **Responsive Design** - Works on mobile, tablet, and desktop
- 🔒 **Privacy First** - All processing happens locally in your browser

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Usage

1. Click "Start Camera" to use your device's camera
2. Or "Upload Photo" to analyze an existing image
3. Capture or select a room photo
4. The app will automatically detect objects and show:
   - Visual bounding boxes around detected items
   - A list of items recommended for removal
   - Confidence scores for each detection
   - Helpful tips for real estate photography

## How It Works

- **Object Detection**: Uses TensorFlow.js + COCO-SSD model to detect 80+ object classes
- **Filtering**: Objects are filtered against a curated list of items commonly removed in real estate photos
- **Local Processing**: All analysis happens in your browser - no image uploads to servers
- **Real-time Feedback**: Get instant recommendations as soon as you capture or upload a photo

## Project Structure

```
src/
├── components/
│   ├── CameraCapture.jsx      # Camera & upload functionality
│   ├── CameraCapture.css
│   ├── ObjectDetector.jsx     # TensorFlow.js integration
│   ├── ObjectDetector.css
│   ├── RemovalList.jsx        # Results & recommendations
│   └── RemovalList.css
├── App.jsx                     # Main app component
├── App.css
└── main.jsx                    # React entry point
```

## Technologies

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **TensorFlow.js** - Machine learning in the browser
- **COCO-SSD** - Pre-trained object detection model
- **CSS3** - Styling with gradients and animations

## Building for Production

```bash
npm run build
```

This creates a `dist/` folder ready for deployment.

## License

MIT
