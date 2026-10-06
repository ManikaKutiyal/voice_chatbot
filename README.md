# Groq Voice Chatbot (Flask + Web Speech API)

A small speech-to-speech chatbot:
- **Speech input:** browser Web Speech API (`SpeechRecognition`)
- **AI response:** Groq API
- **Speech output:** browser Web Speech API (`speechSynthesis`)
- **Backend:** Python + Flask
- **Environment:** Python virtual environment (`.venv`)

This project does **not** use a search API, web search, Tavily, or any other search service. It only needs a Groq API key.

## 1. Important: protect your API key

If you previously pasted an API key into a chat, screenshot, repository, or anywhere public, revoke it and create a new one. Never put your real key in `app.py`, JavaScript, or GitHub.

Create a Groq key at: https://console.groq.com/keys

## 2. Install on Ubuntu

Open a terminal in this project folder:

```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip
```

Create and activate the virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the Python packages:

```bash
pip install -r requirements.txt
```

## 3. Add your Groq API key

Create your local `.env` file:

```bash
cp .env.example .env
nano .env
```

Replace the placeholder with your new key:

```env
GROQ_API_KEY=your_real_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Save in nano with `Ctrl+O`, press Enter, then `Ctrl+X`.

Do not include quotes around the key. Do not share the `.env` file.

## 4. Run the app

With the virtual environment activated:

```bash
python app.py
```

Then open this URL in Chrome:

http://127.0.0.1:5000

To stop the server, press `Ctrl+C` in the terminal.

### Optional one-command launcher

You can also run:

```bash
chmod +x run.sh
./run.sh
```

The script creates the virtual environment and installs packages if needed. If it creates `.env` for the first time, add your key to `.env` and run `./run.sh` again.

## 5. Use it

- Click **Start talking** and allow microphone permission.
- Speak your message.
- The recognized words appear in the input box.
- Click **Send** (or enable auto-send in the interface) to ask Groq.
- The reply appears in the chat and can be spoken aloud.
- You can also type messages instead of using the microphone.

## Notes

- Speech recognition support varies by browser. Chrome or Edge on a current desktop usually works best, but availability can vary by OS and browser settings.
- The Web Speech API's speech recognition may use a browser-provided online recognition service; it is separate from your Groq key. Speech synthesis uses the browser/device voice.
- You need an internet connection for Groq responses.
- This app does not search the web and cannot guarantee up-to-date answers.
- The Flask development server is for local learning/testing, not public production hosting.
