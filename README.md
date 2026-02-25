# LeetCode AI Solver Extension

This project is a Chrome extension that uses an AI backend to automatically solve LeetCode problems and injects the solution directly into the LeetCode editor.

## Features
- One-click solution generation for LeetCode problems
- Supports multiple programming languages (auto-detects language)
- Injects code directly into the LeetCode editor
- Auto-run and auto-submit support
- Retry logic for failed attempts
- Local backend using FastAPI and Groq API

## Project Structure
```
backend/      # FastAPI backend server
extension/    # Chrome extension source code
```

## Getting Started

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```sh
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```sh
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Add your Groq API key to a `.env` file:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
5. Start the backend server:
   ```sh
   uvicorn main:app --reload
   ```
   The backend will run at `http://127.0.0.1:8000`.

### 2. Chrome Extension Setup
1. Go to `chrome://extensions/` in your browser.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select the `extension` folder.
4. Make sure the backend URL in `extension/config.js` is set to `http://127.0.0.1:8000` for local development.
5. Open a LeetCode problem page and click the extension icon to use.


## Credits
- Built with [FastAPI](https://fastapi.tiangolo.com/), [Groq API](https://console.groq.com/), and [Chrome Extensions](https://developer.chrome.com/docs/extensions/).

## License
MIT License
