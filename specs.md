# NutriVision AI - Application Specification

## 1. Executive Summary

NutriVision AI is a mobile-first, voice-enabled web application designed to estimate calories and macronutrients from food images. Leveraging the Google Gemini 2.5 Flash API for computer vision and reasoning, and Gemini 2.5 Flash TTS for voice output, the app provides a seamless, hands-free experience for users to track their nutritional intake. The application runs entirely client-side for privacy and speed, storing the user's API key and history locally.

## 2. User User Flow & Experience

### 2.1 Onboarding
*   **Initial Load:** The user lands on the main interface.
*   **API Key Check:** The app checks `localStorage` for `gemini_api_key`.
*   **Key Missing:** A blocking modal (`ApiKeyModal`) appears, explaining the need for a Google Gemini API key and providing a link to AI Studio to generate one.
*   **Key Entry:** User inputs the key, which is saved to `localStorage`. The modal closes, and the app is ready.

### 2.2 Core Interaction Loop (Scan & Analyze)
1.  **Viewfinder:** The top half of the screen displays a live camera feed (`CameraView`).
2.  **Reference Guide:** An overlay suggests placing food and a hand (for scale) within the frame.
3.  **Capture:** User taps the shutter button or uses a voice command (future scope) to capture an image.
4.  **Analysis:**
    *   The app captures a frame and converts it to base64.
    *   The camera freezes or hides briefly; UI shows an "Analyzing" state.
    *   The image is sent to the Gemini 2.5 Flash model with a specific system prompt to estimate calories, macros, and provide a summary.
5.  **Results (Preview):**
    *   A modal (`NutriCard`) pops up overlaying the screen with the analyzed data (Calories, Protein, Carbs, GI, GL).
    *   **TTS Output:** The app immediately speaks the summary provided by the AI using Gemini TTS.
6.  **Action:**
    *   **Save:** User clicks "Save to History". The image and data are committed to the timeline.
    *   **Dismiss:** User clicks "Cancel". The data is discarded, and the camera reactivates.

### 2.3 Chat & Context
*   **Interface:** The bottom half of the screen is a chat interface.
*   **Modes:**
    *   **Half-screen:** Default view, allowing camera access.
    *   **Fullscreen:** User can swipe up on the chat handle to expand it, hiding the camera.
*   **Interaction:**
    *   User can type text or use the Microphone button for Speech-to-Text (Web Speech API).
    *   Queries (e.g., "Is this good for a diabetic?") include the conversation context.
    *   AI responses are spoken aloud and displayed as text bubbles.
    *   Users can "Save" AI text responses (e.g., recipes) to their history.

### 2.4 History & Management
*   **Access:** A "History" button in the top right.
*   **View:** A list of previously scanned foods (with images) and saved text notes/recipes.
*   **Data Persistence:** Currently, session-based (React state), but intended for local persistence.
*   **Export:** Users can export their history as a JSON file.
*   **Sharing:** Individual items can be shared via WhatsApp or SMS intent links.
*   **Settings:** Users can reset their API key from the History header.

## 3. Technical Architecture

### 3.1 Stack
*   **Framework:** React 19 (Client-side only)
*   **Language:** TypeScript
*   **Build Tool:** Vite (implied by environment)
*   **Styling:** Tailwind CSS
*   **Icons:** Heroicons (SVG)
*   **Charts:** Recharts

### 3.2 AI Services (`services/geminiService.ts`)
*   **Client:** `@google/genai` SDK.
*   **Initialization:** Instantiated dynamically on every call to fetch the latest key from `localStorage`.
*   **Models:**
    *   **Vision/Text:** `gemini-2.5-flash` (Optimized for speed/cost).
    *   **TTS:** `gemini-2.5-flash-preview-tts` (Voice: "Aoede").
*   **Audio Handling:** Raw PCM data from Gemini is decoded into an `AudioBuffer` and played via the Web Audio API (`utils/audioUtils.ts`).

### 3.3 Data Structures (`types.ts`)

**NutritionalData:**
```typescript
interface NutritionalData {
  foodName: string;
  calories: number;
  gi: number;       // Glycemic Index
  gl: number;       // Glycemic Load
  carbs: number;    // Grams
  protein: number;  // Grams
  summary: string;  // Spoken text
}
```

**Message:**
```typescript
interface Message {
  id: string;
  type: 'USER_TEXT' | 'USER_IMAGE' | 'AI_TEXT' | 'AI_CARD';
  content?: string;
  data?: NutritionalData;
  imageData?: string;
  timestamp: number;
  isSaved?: boolean;
}
```

## 4. Component Hierarchy

*   **App.tsx** (Main Controller, State: Messages, AppState, Camera Active)
    *   **ApiKeyModal** (Input form, validation)
    *   **CameraView** (HTML5 Video/Canvas, Capture logic)
    *   **NutriCard** (Display Widget, Recharts BarChart, GI/GL visualizers)
    *   **HistoryView** (List view, Export/Share logic)

## 5. UI/UX Specifications

### 5.1 Color Palette (Dark Mode)
*   **Background:** Slate 900 (`#0f172a`)
*   **Cards/Surfaces:** Slate 800 (`#1e293b`)
*   **Accents:**
    *   Green 400 (`#4ade80`) - Success, Low GI
    *   Yellow 400 (`#facc15`) - Carbs, Medium GI
    *   Blue 400 (`#60a5fa`) - Protein
    *   Red 500 (`#ef4444`) - Recording, Errors, High GI

### 5.2 Animations
*   **Transitions:** Smooth opacity/transform transitions for modals and chat expansion.
*   **Micro-interactions:** Pulse effect on recording button, bounce effect on AI "thinking" indicator.

### 5.3 Mobile Optimization
*   **Touch Targets:** Minimum 44px for buttons.
*   **Gestures:** Swipe-up to expand chat.
*   **Layout:** Fixed viewport height preventing scroll bounce, customized scrollbars hidden.
*   **Input:** "environment" facing mode for camera.

## 6. Security & Privacy
*   **API Key:** Stored strictly in `localStorage`. Never transmitted to any 3rd party server besides Google's API endpoint directly.
*   **Images:** Processed in memory and sent to Google. Stored in memory (history) during the session.

## 7. Future Enhancements (Roadmap)
*   **Persistence:** Save history to `localStorage` or IndexedDB.
*   **Voice Commands:** "Capture this", "Stop recording".
*   **Multi-modal inputs:** Analyze video streams directly (Gemini Live API).
*   **User Profile:** Calorie goals and daily tracking totals.
