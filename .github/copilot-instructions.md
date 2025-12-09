# Photo Prep - AI Coding Agent Instructions

## Project Overview
**Photo Prep** is a React + Vite web app for real estate photography that runs COCO-SSD object detection locally in the browser using TensorFlow.js. No images leave the user's device.

## Architecture

### Data Flow
1. **CameraCapture** → captures image via camera or file upload → passes base64 to App
2. **App** → manages state (cameraImage, detectedObjects, removalRecommendations)
3. **ObjectDetector** → runs COCO-SSD model on image → returns predictions with `class`, `bbox`, `score`
4. **App.filterForRemoval()** → filters predictions against curated removal list → passes to RemovalList
5. **RemovalList** → displays filtered recommendations with confidence scores

### Component Boundaries
- **CameraCapture** (`src/components/CameraCapture.jsx`): Handles MediaStream API & file input, manages video refs
- **ObjectDetector** (`src/components/ObjectDetector.jsx`): TensorFlow.js integration, model loading & inference, canvas drawing
- **RemovalList** (`src/components/RemovalList.jsx`): Pure presentation, displays detection results & tips
- **App** (`src/App.jsx`): State orchestration, object filtering logic (`filterForRemoval`)

## Key Patterns

### Removal List Filtering
The `filterForRemoval()` function in `App.jsx` uses **substring matching** (case-insensitive, bidirectional):
```javascript
removalList.some(item => 
  obj.class.toLowerCase().includes(item) || 
  item.includes(obj.class.toLowerCase())
)
```
This catches variations like "person" detecting as "Person" or "sports equipment" matching "sports ball".
**To add items**, edit the `removalList` array in `App.jsx:25-30` — no separate config files.

### Model & Dependencies
- **TensorFlow.js** (`@tensorflow/tfjs`): Core ML runtime
- **COCO-SSD** (`@tensorflow-models/coco-ssd`): Pre-trained detection model (80+ classes)
- Models are **lazy-loaded** in ObjectDetector's `useEffect` — they download on first image analysis
- No model files in repo; downloaded from CDN at runtime

### Browser APIs
- **MediaStream API** (`navigator.mediaDevices.getUserMedia`) → camera access with `facingMode: 'environment'`
- **Canvas API** → image capture & bounding box rendering
- **FileReader API** → image file uploads to base64

## Development Workflow

### Start Dev Server
```bash
npm install
npm run dev
```
Opens http://localhost:5173 with HMR enabled via Vite.

### Build for Production
```bash
npm run build
```
Creates optimized `dist/` folder. COCO-SSD model downloads at runtime from CDN (no model bundling).

### Linting
```bash
npm lint
```
Uses ESLint with React plugin. No auto-fix configured.

## Common Tasks

### Adding New Filter Rules
Edit the `removalList` array in `App.jsx:25-30`. Add strings that match COCO-SSD class names (see [COCO-SSD docs](https://github.com/tensorflow-models/coco-ssd) for full class list).

### Changing Detection Styling
- Bounding box color & thickness: `ObjectDetector.jsx:52-53` (`strokeStyle`, `lineWidth`)
- Label font & color: `ObjectDetector.jsx:59-62`
- Canvas rendering happens only when `canvasRef.current` exists

### Debugging Detection
- Model predictions available in `App.handleDetectionComplete` → log `objects` array
- COCO-SSD returns: `{ class: string, score: number (0-1), bbox: [x, y, width, height] }`
- Confidence filtering not implemented; all detections shown (adjust in `filterForRemoval` if needed)

### Camera Permissions & Mobile
- iOS requires HTTPS + user gesture to access camera
- The `facingMode: 'environment'` targets rear camera on mobile
- Test on actual devices; desktop Chrome can use mock camera

## File Conventions
- Components in `src/components/`, styles co-located (e.g., `CameraCapture.jsx` + `CameraCapture.css`)
- No shared utilities or hooks directory (all logic in components or App)
- State lifting: App manages all shared state; components are mostly presentational
