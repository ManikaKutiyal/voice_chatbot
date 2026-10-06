const input = document.getElementById("messageInput");
const chat = document.getElementById("messages");
const form = document.getElementById("chatForm");
const mic = document.getElementById("micButton");
const micLabel = document.getElementById("micLabel");
const autoSpeak = document.getElementById("autoSpeak");
const sendButton = document.getElementById("sendButton");

let history = [];
let isListening = false;

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function addMessage(text, sender) {
    const row = document.createElement("div");

    if (sender === "You") {
        row.className = "message-row user-row";
        row.innerHTML = `<div class="bubble user-bubble">${escapeHtml(text)}</div>`;
    } else if (sender === "Bot") {
        row.className = "message-row";
        row.innerHTML = `
            <div class="assistant-avatar">✦</div>
            <div class="bubble assistant-bubble">${escapeHtml(text)}</div>
        `;
    } else {
        row.className = "error-box";
        row.textContent = text;
    }

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
}

async function sendMessage(text) {
    text = text.trim();
    if (!text) return;

    addMessage(text, "You");
    input.value = "";
    input.focus();

    const thinkingRow = document.createElement("div");
    thinkingRow.className = "message-row thinking-row";
    thinkingRow.innerHTML = `
        <div class="assistant-avatar">✦</div>
        <div class="bubble assistant-bubble thinking">Thinking… 💭</div>
    `;
    chat.appendChild(thinkingRow);
    chat.scrollTop = chat.scrollHeight;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: text,
                history: history
            })
        });

        const data = await response.json();

        if (thinkingRow.parentNode) {
            thinkingRow.remove();
        }

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong");
        }

        const answer = data.answer;
        addMessage(answer, "Bot");

        history.push(
            { role: "user", content: text },
            { role: "assistant", content: answer }
        );

        if (autoSpeak && autoSpeak.checked) {
            const speech = new SpeechSynthesisUtterance(answer);
            speech.lang = "en-US";
            speechSynthesis.speak(speech);
        }

    } catch (error) {
        if (thinkingRow.parentNode) {
            thinkingRow.remove();
        }
        addMessage(error.message, "Error");
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
});

const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    function resetMicUI() {
        isListening = false;
        mic.classList.remove("listening", "speaking");
        if (micLabel) micLabel.textContent = "Start talking";
        input.placeholder = "Type your message here…";
    }

    mic.addEventListener("click", () => {
        if (isListening) {
            recognition.stop();
            resetMicUI();
        } else {
            try {
                recognition.start();
            } catch (err) {
                console.warn("Speech recognition already running:", err);
            }
        }
    });

    recognition.onstart = () => {
        isListening = true;
        mic.classList.add("listening");
        mic.classList.remove("speaking");
        if (micLabel) micLabel.textContent = "Listening… 🌸";
        input.placeholder = "Listening… speak now ✨";
    };

    recognition.onspeechstart = () => {
        mic.classList.add("speaking");
        if (micLabel) micLabel.textContent = "Hearing you… 🎙️";
    };

    recognition.onspeechend = () => {
        mic.classList.remove("speaking");
        if (micLabel) micLabel.textContent = "Processing… ✨";
    };

    recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (interimTranscript) {
            input.value = interimTranscript;
            mic.classList.add("speaking");
            if (micLabel) micLabel.textContent = "Hearing you… 🎙️";
        }

        if (finalTranscript) {
            input.value = finalTranscript;
            resetMicUI();
            sendMessage(finalTranscript);
        }
    };

    recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        resetMicUI();
    };

    recognition.onend = () => {
        resetMicUI();
    };

} else {
    mic.disabled = true;
    if (micLabel) micLabel.textContent = "Mic not supported";
}