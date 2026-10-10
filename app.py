import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from groq import Groq

load_dotenv()

app = Flask(__name__)

api_key = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=api_key) if api_key else None
MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

PERSONAS = {
    "default": "You are Aura, an adorable, warm, and cheerful AI voice friend. Speak naturally like a caring, enthusiastic human. Keep your answers short, sweet, conversational, and delightful to listen to aloud (1 to 3 friendly sentences). Avoid stiff robot phrasing or bullet lists.",
    "beach": "You are Sunny, a super chill and cheerful tropical beach buddy! You love the ocean waves, warm sunshine, and relaxing vibes. Speak with breezy warmth and cute positivity in short, natural sentences.",
    "sage": "You are a gentle, wise friend with a kind heart. Share lovely, calming insights in concise, thoughtful, and human-sounding words.",
    "tech": "You are a brilliant and supportive developer friend. Explain things clearly and enthusiastically in concise, friendly terms without boring jargon.",
    "zen": "You are a peaceful, mindful guide. Speak in soothing, gentle, and reassuring short sentences that make the listener feel calm and happy.",
    "storyteller": "You are a charming, cozy storyteller. Share vivid, delightful micro-stories with playful warmth and wonder."
}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/config", methods=["GET"])
def get_config():
    return jsonify({
        "model": MODEL,
        "has_api_key": bool(api_key),
        "personas": list(PERSONAS.keys())
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    global client
    if not client:
        # Retry reading in case env was updated
        curr_key = os.getenv("GROQ_API_KEY", "")
        if curr_key:
            client = Groq(api_key=curr_key)
        else:
            return jsonify({
                "error": "GROQ_API_KEY is not configured in .env. Please set your API key to chat with Groq."
            }), 400

    data = request.json or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])
    persona_key = data.get("persona", "default")
    custom_system_prompt = data.get("system_prompt")

    if not message:
        return jsonify({"error": "Message cannot be empty."}), 400

    system_prompt = custom_system_prompt or PERSONAS.get(persona_key, PERSONAS["default"])

    messages = [{"role": "system", "content": system_prompt}]

    # Include recent context (last 8 turns for responsive voice chat)
    if isinstance(history, list):
        for entry in history[-8:]:
            if isinstance(entry, dict) and entry.get("role") in ["user", "assistant"] and entry.get("content"):
                messages.append({
                    "role": entry["role"],
                    "content": entry["content"]
                })

    # Add current user message
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )

        answer = response.choices[0].message.content
        return jsonify({
            "answer": answer,
            "model": MODEL
        })
    except Exception as e:
        error_msg = str(e)
        return jsonify({
            "error": f"Groq API Error: {error_msg}"
        }), 500

if __name__ == "__main__":
    app.run(debug=True)