/**
 * AURA VOICE AI — Interactive Web Application
 * Features:
 * - 8 Atmospheric Themes with dynamic canvas particle engine
 * - Procedural Web Audio Ambient Soundscapes (Waves, Mountain Wind, Rain, Zen)
 * - UI Haptic Sound Effects via Web Audio API
 * - Real-time Voice Recognition & Speech Synthesis with Voice Select
 * - Real-time Audio Visualizer with AnalyserNode
 * - Chat Sessions & Export to Markdown
 * - Switchable AI Personas & Latency Tracking
 */

(() => {
  'use strict';

  // --- STATE ---
  const state = {
    theme: localStorage.getItem('aura_theme') || 'beach',
    persona: localStorage.getItem('aura_persona') || 'beach',
    autoSpeak: localStorage.getItem('aura_auto_speak') !== 'false',
    handsFree: localStorage.getItem('aura_hands_free') === 'true',
    sfxEnabled: localStorage.getItem('aura_sfx') !== 'false',
    bgParticles: localStorage.getItem('aura_particles') !== 'false',
    soundscape: localStorage.getItem('aura_soundscape') || 'waves',
    soundscapeVolume: parseFloat(localStorage.getItem('aura_soundscape_vol') || '0.25'),
    speechVoiceURI: localStorage.getItem('aura_voice_uri') || '',
    speechRate: parseFloat(localStorage.getItem('aura_speech_rate') || '1.02'),
    speechPitch: parseFloat(localStorage.getItem('aura_speech_pitch') || '1.12'),
    customPrompt: localStorage.getItem('aura_custom_prompt') || '',
    currentSessionId: Date.now().toString(),
    history: [], // current conversation turns: [{role, content}]
    isListening: false,
    isSpeaking: false,
    spaceKeyHeld: false
  };

  // --- DOM ELEMENTS ---
  const dom = {
    body: document.body,
    html: document.documentElement,
    canvas: document.getElementById('ambientCanvas'),
    visualizerCanvas: document.getElementById('audioVisualizerCanvas'),
    messages: document.getElementById('messages'),
    welcomeHero: document.getElementById('welcomeHero'),
    chatViewport: document.getElementById('chatViewport'),
    chatForm: document.getElementById('chatForm'),
    messageInput: document.getElementById('messageInput'),
    sendButton: document.getElementById('sendButton'),
    micButton: document.getElementById('micButton'),
    micLabel: document.getElementById('micLabel'),
    voiceInputQuickBtn: document.getElementById('voiceInputQuickBtn'),
    stopSpeechBtn: document.getElementById('stopSpeechBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    newChatBtn: document.getElementById('newChatBtn'),
    sessionList: document.getElementById('sessionList'),
    clearAllSessionsBtn: document.getElementById('clearAllSessionsBtn'),
    exportChatBtn: document.getElementById('exportChatBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
    sidebarCloseBtn: document.getElementById('sidebarCloseBtn'),
    themePickerBtn: document.getElementById('themePickerBtn'),
    currentThemeIcon: document.getElementById('currentThemeIcon'),
    currentThemeName: document.getElementById('currentThemeName'),
    openThemeModalBtn: document.getElementById('openThemeModalBtn'),
    themeModal: document.getElementById('themeModal'),
    themeModalCloseBtn: document.getElementById('themeModalCloseBtn'),
    themeCatalogGrid: document.getElementById('themeCatalogGrid'),
    settingsModal: document.getElementById('settingsModal'),
    settingsModalOpenBtn: document.getElementById('settingsModalOpenBtn'),
    settingsModalCloseBtn: document.getElementById('settingsModalCloseBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    resetSettingsBtn: document.getElementById('resetSettingsBtn'),
    voiceSelect: document.getElementById('voiceSelect'),
    speechRate: document.getElementById('speechRate'),
    speechRateVal: document.getElementById('speechRateVal'),
    speechPitch: document.getElementById('speechPitch'),
    speechPitchVal: document.getElementById('speechPitchVal'),
    bgParticlesToggle: document.getElementById('bgParticlesToggle'),
    sfxAudioToggle: document.getElementById('sfxAudioToggle'),
    sfxToggleBtn: document.getElementById('sfxToggleBtn'),
    customSystemPrompt: document.getElementById('customSystemPrompt'),
    autoSpeak: document.getElementById('autoSpeak'),
    handsFreeMode: document.getElementById('handsFreeMode'),
    soundscapeChips: document.getElementById('soundscapeChips'),
    soundscapeStatus: document.getElementById('soundscapeStatus'),
    soundscapeVolume: document.getElementById('soundscapeVolume'),
    soundscapeVolumeVal: document.getElementById('soundscapeVolumeVal'),
    personaSelector: document.getElementById('personaSelector'),
    activePersonaBadge: document.getElementById('activePersonaBadge'),
    latencyIndicator: document.getElementById('latencyIndicator'),
    latencyValue: document.getElementById('latencyValue'),
    liveAudioStateBadge: document.getElementById('liveAudioStateBadge'),
    liveAudioStateText: document.getElementById('liveAudioStateText'),
    errorBox: document.getElementById('errorBox'),
    errorText: document.getElementById('errorText'),
    dismissErrorBtn: document.getElementById('dismissErrorBtn')
  };

  // --- THEMES DEFINITION ---
  const THEMES = {
    beach: { name: 'Tropical Beach', icon: '🏖️', badge: 'Sunny' },
    waves: { name: 'Ocean Waves', icon: '🌊', badge: 'Aqua' },
    mountain: { name: 'Alpine Mountain', icon: '🏔️', badge: 'Earthy' },
    aurora: { name: 'Cosmic Aurora', icon: '🌌', badge: 'Nebula' },
    cyberpunk: { name: 'Cyberpunk Neon', icon: '⚡', badge: 'Hi-Tech' },
    sakura: { name: 'Sakura Blossom', icon: '🌸', badge: 'Zen' },
    sunset: { name: 'Desert Sunset', icon: '🌅', badge: 'Warm' },
    obsidian: { name: 'Obsidian Minimal', icon: '🌑', badge: 'Stealth' }
  };

  // --- AUDIO CONTEXT FOR PROCEDURAL SOUNDS & VISUALIZER ---
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // --- CUTE SOUND EFFECTS (HAPTICS) ---
  const sfx = {
    play(type) {
      if (!state.sfxEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        if (type === 'send') {
          // Cute bubbly water-drop "bloop! ✨"
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.13);
        } else if (type === 'receive') {
          // Cheerful music-box bell chime (F5 -> A5 -> C6)
          const notes = [698.46, 880.00, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.07;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.09, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.36);
          });
        } else if (type === 'micOn') {
          // Cute sparkly upward chirp ✨
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(580, now);
          osc.frequency.exponentialRampToValueAtTime(1160, now + 0.09);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'micOff') {
          // Soft cute droplet pop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(780, now);
          osc.frequency.exponentialRampToValueAtTime(390, now + 0.08);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === 'click') {
          // Cute jelly tap
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(720, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.06);
        }
      } catch (e) {
        console.warn('SFX audio error:', e);
      }
    }
  };

  // --- PROCEDURAL AMBIENT SOUNDSCAPES ---
  const soundscapeEngine = {
    sourceNode: null,
    gainNode: null,
    filterNode: null,
    lfoNode: null,
    timer: null,

    start(type) {
      this.stop();
      if (type === 'off') {
        state.soundscape = 'off';
        if (dom.soundscapeStatus) dom.soundscapeStatus.textContent = 'Off';
        return;
      }

      const ctx = getAudioCtx();
      if (!ctx) return;

      state.soundscape = type;
      if (dom.soundscapeStatus) dom.soundscapeStatus.textContent = type.toUpperCase();

      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(state.soundscapeVolume, ctx.currentTime);
      this.gainNode.connect(ctx.destination);

      if (type === 'waves' || type === 'breeze' || type === 'rain') {
        // Procedural White/Pink Noise Buffer
        const bufferSize = ctx.sampleRate * 4;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.25;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        if (type === 'waves') {
          // Modulated Low-pass filter simulating ocean waves roll
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(260, ctx.currentTime);
          filter.Q.setValueAtTime(2.5, ctx.currentTime);

          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(0.11, ctx.currentTime); // Wave period ~9s
          lfoGain.gain.setValueAtTime(220, ctx.currentTime);

          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          whiteNoise.connect(filter);
          filter.connect(this.gainNode);
          lfo.start();
          this.lfoNode = lfo;
        } else if (type === 'breeze') {
          // Bandpass mountain wind
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(450, ctx.currentTime);
          filter.Q.setValueAtTime(4, ctx.currentTime);

          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
          lfoGain.gain.setValueAtTime(150, ctx.currentTime);

          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          whiteNoise.connect(filter);
          filter.connect(this.gainNode);
          lfo.start();
          this.lfoNode = lfo;
        } else if (type === 'rain') {
          // Highpass crisp rain drizzle
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(800, ctx.currentTime);
          filter.Q.setValueAtTime(0.8, ctx.currentTime);

          whiteNoise.connect(filter);
          filter.connect(this.gainNode);
        }

        whiteNoise.start();
        this.sourceNode = whiteNoise;

      } else if (type === 'zen') {
        // Periodic resonant singing bowl chime
        const playBell = () => {
          if (state.soundscape !== 'zen') return;
          const now = ctx.currentTime;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const bellGain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(432, now); // Zen A
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(864, now); // Harmonic

          bellGain.gain.setValueAtTime(0.18, now);
          bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

          osc1.connect(bellGain);
          osc2.connect(bellGain);
          bellGain.connect(this.gainNode);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 6);
          osc2.stop(now + 6);
        };

        playBell();
        this.timer = setInterval(playBell, 7000);
      }
    },

    setVolume(val) {
      state.soundscapeVolume = val;
      localStorage.setItem('aura_soundscape_vol', val);
      if (this.gainNode && audioCtx) {
        this.gainNode.gain.setValueAtTime(val, audioCtx.currentTime);
      }
    },

    stop() {
      if (this.sourceNode) {
        try { this.sourceNode.stop(); } catch (e) {}
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.lfoNode) {
        try { this.lfoNode.stop(); } catch (e) {}
        this.lfoNode.disconnect();
        this.lfoNode = null;
      }
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  };

  // --- DYNAMIC ATMOSPHERIC PARTICLES BACKGROUND ---
  const particles = {
    items: [],
    animId: null,
    ctx: null,
    width: 0,
    height: 0,
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },

    init() {
      if (!dom.canvas) return;
      this.ctx = dom.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });
      this.createParticles();
      this.loop();
    },

    resize() {
      if (!dom.canvas) return;
      this.width = dom.canvas.width = window.innerWidth;
      this.height = dom.canvas.height = window.innerHeight;
    },

    createParticles() {
      this.items = [];
      const count = window.innerWidth < 768 ? 28 : 50;
      for (let i = 0; i < count; i++) {
        this.items.push(this.newParticle());
      }
    },

    newParticle() {
      const theme = state.theme;
      return {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 4 + 1.5,
        speedX: (Math.random() - 0.5) * (theme === 'waves' ? 0.6 : 0.8),
        speedY: (Math.random() - 0.5) * 0.6 + (theme === 'sunset' ? -0.5 : theme === 'sakura' ? 0.7 : 0),
        alpha: Math.random() * 0.6 + 0.2,
        wobble: Math.random() * Math.PI * 2,
        color: this.getThemeColor()
      };
    },

    getThemeColor() {
      switch (state.theme) {
        case 'waves': return 'rgba(56, 189, 248, ';
        case 'beach': return 'rgba(245, 158, 11, ';
        case 'mountain': return 'rgba(52, 211, 153, ';
        case 'aurora': return Math.random() > 0.5 ? 'rgba(168, 85, 247, ' : 'rgba(52, 211, 153, ';
        case 'cyberpunk': return Math.random() > 0.5 ? 'rgba(236, 72, 153, ' : 'rgba(6, 182, 212, ';
        case 'sakura': return 'rgba(251, 113, 133, ';
        case 'sunset': return 'rgba(249, 115, 22, ';
        default: return 'rgba(255, 255, 255, ';
      }
    },

    updateAndDraw() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.width, this.height);

      if (!state.bgParticles) return;

      const theme = state.theme;

      // Draw subtle wave gradient lines for 'waves' theme
      if (theme === 'waves') {
        const time = Date.now() * 0.0012;
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        this.ctx.lineWidth = 2.5;
        for (let x = 0; x < this.width; x += 15) {
          const y = this.height * 0.75 + Math.sin(x * 0.005 + time) * 35;
          if (x === 0) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
      }

      for (let p of this.items) {
        p.wobble += 0.02;
        p.x += p.speedX + Math.sin(p.wobble) * 0.3;
        p.y += p.speedY;

        // Wrap around borders
        if (p.x < -10) p.x = this.width + 10;
        if (p.x > this.width + 10) p.x = -10;
        if (p.y < -10) p.y = this.height + 10;
        if (p.y > this.height + 10) p.y = -10;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color + p.alpha + ')';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = p.color + '0.5)';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    },

    loop() {
      this.updateAndDraw();
      this.animId = requestAnimationFrame(() => this.loop());
    }
  };

  // --- AUDIO VISUALIZER (CANVAS) ---
  const visualizer = {
    canvas: null,
    ctx: null,
    analyser: null,
    dataArray: null,
    animId: null,
    micStream: null,

    init() {
      if (!dom.visualizerCanvas) return;
      this.canvas = dom.visualizerCanvas;
      this.ctx = this.canvas.getContext('2d');
      this.drawIdle();
    },

    async attachMicStream(stream) {
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        this.micStream = stream;
        const source = ctx.createMediaStreamSource(stream);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.startLoop();
      } catch (err) {
        console.warn('Audio visualizer analyser attachment error:', err);
      }
    },

    startLoop() {
      if (this.animId) cancelAnimationFrame(this.animId);
      const render = () => {
        this.draw();
        this.animId = requestAnimationFrame(render);
      };
      render();
    },

    draw() {
      if (!this.ctx || !this.canvas) return;
      const width = this.canvas.width = this.canvas.offsetWidth || 300;
      const height = this.canvas.height;
      this.ctx.clearRect(0, 0, width, height);

      const numBars = 32;
      const barWidth = (width / numBars) - 2;
      const centerY = height / 2;

      let freqData = [];
      if (this.analyser && state.isListening) {
        this.analyser.getByteFrequencyData(this.dataArray);
        freqData = this.dataArray;
      }

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (state.isListening && freqData.length) {
          const val = freqData[i % freqData.length] / 255;
          barHeight = Math.max(4, val * height * 0.9);
        } else if (state.isSpeaking) {
          const time = Date.now() * 0.008;
          const wave = Math.sin(time + i * 0.4) * 0.5 + 0.5;
          barHeight = Math.max(4, wave * height * 0.75);
        }

        const x = i * (barWidth + 2);
        const y = centerY - (barHeight / 2);

        this.ctx.fillStyle = state.isListening
          ? 'rgba(239, 68, 68, 0.85)'
          : state.isSpeaking
          ? 'rgba(56, 189, 248, 0.9)'
          : 'rgba(125, 211, 252, 0.3)';

        this.ctx.beginPath();
        this.ctx.roundRect(x, y, barWidth, barHeight, 2);
        this.ctx.fill();
      }
    },

    drawIdle() {
      if (this.animId) cancelAnimationFrame(this.animId);
      if (!this.ctx || !this.canvas) return;
      const width = this.canvas.width = this.canvas.offsetWidth || 300;
      const height = this.canvas.height;
      this.ctx.clearRect(0, 0, width, height);

      const numBars = 32;
      const barWidth = (width / numBars) - 2;
      const centerY = height / 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);
        this.ctx.fillStyle = 'rgba(125, 211, 252, 0.25)';
        this.ctx.beginPath();
        this.ctx.roundRect(x, centerY - 2, barWidth, 4, 2);
        this.ctx.fill();
      }
    }
  };

  // --- THEME ENGINE ---
  function applyTheme(themeId) {
    if (!THEMES[themeId]) themeId = 'waves';
    state.theme = themeId;
    localStorage.setItem('aura_theme', themeId);
    dom.html.setAttribute('data-theme', themeId);

    const theme = THEMES[themeId];
    if (dom.currentThemeIcon) dom.currentThemeIcon.textContent = theme.icon;
    if (dom.currentThemeName) dom.currentThemeName.textContent = theme.name;

    // Highlight active in catalog
    document.querySelectorAll('.theme-catalog-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-theme-id') === themeId);
    });

    particles.createParticles();
    sfx.play('click');
  }

  // --- CHAT MESSAGING & PARSING ---
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatMessageText(text) {
    let out = escapeHtml(text);
    // Markdown code blocks
    out = out.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline code
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Newlines to <br> or paragraphs
    out = out.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    return out;
  }

  function addMessage(text, sender) {
    if (dom.welcomeHero && dom.welcomeHero.style.display !== 'none') {
      dom.welcomeHero.style.display = 'none';
    }

    const row = document.createElement('div');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (sender === 'You') {
      row.className = 'message-row user-row';
      row.innerHTML = `
        <div class="message-bubble-wrapper">
          <div class="message-meta">
            <span class="sender-name">You</span>
            <span class="message-time">${now}</span>
          </div>
          <div class="bubble user-bubble">${formatMessageText(text)}</div>
        </div>
      `;
    } else if (sender === 'Bot') {
      row.className = 'message-row assistant-row';
      const botEmoji = state.theme === 'beach' ? '🏖️' : state.theme === 'sakura' ? '🌸' : '🫧';
      row.innerHTML = `
        <div class="assistant-avatar cute-avatar" aria-hidden="true">
          <span>${botEmoji}</span>
        </div>
        <div class="message-bubble-wrapper">
          <div class="message-meta">
            <span class="sender-name">Aura ✨</span>
            <span class="message-time">${now}</span>
          </div>
          <div class="bubble assistant-bubble">${formatMessageText(text)}</div>
          <div class="message-actions">
            <div class="cute-reactions">
              <button class="cute-react-btn" data-emoji="❤️" title="Love this">❤️</button>
              <button class="cute-react-btn" data-emoji="🐾" title="Paw-some">🐾</button>
              <button class="cute-react-btn" data-emoji="🏖️" title="Beach vibe">🏖️</button>
              <button class="cute-react-btn" data-emoji="✨" title="Sparkle">✨</button>
            </div>
            <button class="msg-action-btn speak-msg-btn" title="Speak message aloud">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>
            </button>
            <button class="msg-action-btn copy-msg-btn" title="Copy message">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>
      `;

      // Attach action handlers
      const speakBtn = row.querySelector('.speak-msg-btn');
      speakBtn.addEventListener('click', () => speakText(text));

      const copyBtn = row.querySelector('.copy-msg-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text);
        copyBtn.title = 'Copied! ✨';
        sfx.play('click');
        setTimeout(() => copyBtn.title = 'Copy message', 1500);
      });

      // Cute reaction buttons
      row.querySelectorAll('.cute-react-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.classList.toggle('reacted');
          sfx.play('click');
        });
      });
    }

    dom.messages.appendChild(row);
    dom.chatViewport.scrollTop = dom.chatViewport.scrollHeight;
  }

  function addThinkingIndicator() {
    const row = document.createElement('div');
    row.className = 'message-row assistant-row thinking-row';
    row.id = 'thinkingIndicator';
    row.innerHTML = `
      <div class="assistant-avatar" aria-hidden="true">
        <span>✦</span>
      </div>
      <div class="message-bubble-wrapper">
        <div class="bubble assistant-bubble thinking-bubble">
          <span>Thinking</span>
          <span class="thinking-dots"><span></span><span></span><span></span></span>
        </div>
      </div>
    `;
    dom.messages.appendChild(row);
    dom.chatViewport.scrollTop = dom.chatViewport.scrollHeight;
    return row;
  }

  function removeThinkingIndicator() {
    const el = document.getElementById('thinkingIndicator');
    if (el) el.remove();
  }

  function showError(msg) {
    if (!dom.errorBox) return;
    dom.errorText.textContent = msg;
    dom.errorBox.hidden = false;
    dom.errorBox.classList.add('show');
  }

  function hideError() {
    if (dom.errorBox) {
      dom.errorBox.hidden = true;
      dom.errorBox.classList.remove('show');
    }
  }

  // --- SEND MESSAGE VIA GROQ API ---
  async function sendMessage(text) {
    text = (text || '').trim();
    if (!text) return;

    hideError();
    addMessage(text, 'You');
    dom.messageInput.value = '';
    sfx.play('send');

    // UI Loading state
    dom.sendButton.disabled = true;
    const thinkingRow = addThinkingIndicator();
    setLiveAudioState('processing', 'Processing...');

    const startTime = performance.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: state.history,
          persona: state.persona,
          system_prompt: state.customPrompt || null
        })
      });

      const elapsed = Math.round(performance.now() - startTime);
      if (dom.latencyValue) dom.latencyValue.textContent = `${elapsed}ms`;

      const data = await response.json();
      removeThinkingIndicator();
      dom.sendButton.disabled = false;
      setLiveAudioState('ready', 'Ready 🏖️');

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to Groq API');
      }

      const answer = data.answer || '(No reply received)';
      addMessage(answer, 'Bot');
      sfx.play('receive');

      // Update in-memory history
      state.history.push(
        { role: 'user', content: text },
        { role: 'assistant', content: answer }
      );
      saveCurrentSession();

      // Speak response if auto-speak is enabled
      if (state.autoSpeak) {
        speakText(answer);
      }

    } catch (err) {
      removeThinkingIndicator();
      dom.sendButton.disabled = false;
      setLiveAudioState('ready', 'Ready 🏖️');
      showError(err.message);
    }
  }

  function speakText(answer) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Clean markdown before speaking
    const cleanText = (answer || '')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`[^`]+`/g, '')
      .replace(/[*_#~>]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE00}-\u{FE0F}]/gu, '')
      .trim();

    if (!cleanText) return;

    const speech = new SpeechSynthesisUtterance(cleanText);

    speech.lang = "en-US";
    speech.rate = 0.9;    // speaking speed
    speech.pitch = 1.0;   // voice pitch
    speech.volume = 1.0;  // volume

    speech.onstart = () => {
      state.isSpeaking = true;
      dom.micButton.classList.add('speaking');
      if (dom.stopSpeechBtn) dom.stopSpeechBtn.style.display = 'inline-flex';
      setLiveAudioState('speaking', 'Speaking... 🌸');
      visualizer.startLoop();
    };

    speech.onend = speech.onerror = () => {
      state.isSpeaking = false;
      dom.micButton.classList.remove('speaking');
      if (dom.stopSpeechBtn) dom.stopSpeechBtn.style.display = 'none';
      setLiveAudioState('ready', 'Ready 🏖️');
      visualizer.drawIdle();

      if (state.handsFree && !state.isListening) {
        setTimeout(startSpeechRecognition, 400);
      }
    };

    speechSynthesis.speak(speech);
  }

  function stopSpeaking() {
    state.isSpeaking = false;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    dom.micButton.classList.remove('speaking');
    if (dom.stopSpeechBtn) dom.stopSpeechBtn.style.display = 'none';
    setLiveAudioState('ready', 'Ready 🏖️');
    visualizer.drawIdle();
  }

  // --- SPEECH RECOGNITION (VOICE INPUT) ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      state.isListening = true;
      dom.micButton.classList.add('listening');
      if (dom.micLabel) dom.micLabel.textContent = 'Listening...';
      dom.messageInput.placeholder = 'Listening to your voice... ✨';
      setLiveAudioState('recording', 'Listening...');
      sfx.play('micOn');
      visualizer.startLoop();

      // Connect user mic stream to visualizer if permitted
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !visualizer.micStream) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
          visualizer.attachMicStream(stream);
        }).catch(() => {});
      }
    };

    recognition.onresult = (e) => {
      let interim = '';
      let final = '';

      for (let i = e.resultIndex; i < e.results.length; ++i) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        dom.messageInput.value = interim;
      }

      if (final) {
        dom.messageInput.value = final;
        stopSpeechRecognition();
        sendMessage(final);
      }
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      stopSpeechRecognition();
    };

    recognition.onend = () => {
      stopSpeechRecognition();
    };
  } else {
    if (dom.micButton) {
      dom.micButton.title = 'Speech recognition not supported in this browser';
    }
  }

  function startSpeechRecognition() {
    if (!recognition) return;
    if (state.isSpeaking) stopSpeaking();
    try {
      recognition.start();
    } catch (err) {
      console.warn('Recognition start caught:', err);
    }
  }

  function stopSpeechRecognition() {
    if (!recognition) return;
    state.isListening = false;
    dom.micButton.classList.remove('listening');
    if (dom.micLabel) dom.micLabel.textContent = 'Tap to talk';
    dom.messageInput.placeholder = 'Ask anything or use voice... (Press Enter to send)';
    setLiveAudioState('ready', 'Ready');
    visualizer.drawIdle();
    try { recognition.stop(); } catch (e) {}
  }

  function toggleSpeechRecognition() {
    if (state.isListening) {
      stopSpeechRecognition();
      sfx.play('micOff');
    } else {
      startSpeechRecognition();
    }
  }

  function setLiveAudioState(mode, text) {
    if (!dom.liveAudioStateBadge || !dom.liveAudioStateText) return;
    dom.liveAudioStateBadge.className = `visualizer-status-pill ${mode}`;
    dom.liveAudioStateText.textContent = text;
  }

  // --- SESSIONS & LOCALSTORAGE HISTORY ---
  function getSavedSessions() {
    try {
      return JSON.parse(localStorage.getItem('aura_sessions') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCurrentSession() {
    if (!state.history.length) return;
    const sessions = getSavedSessions();
    const firstUserMsg = state.history.find(h => h.role === 'user');
    const title = firstUserMsg ? firstUserMsg.content.slice(0, 36) : 'Conversation';

    const existingIdx = sessions.findIndex(s => s.id === state.currentSessionId);
    const sessionObj = {
      id: state.currentSessionId,
      title: title,
      history: state.history,
      updatedAt: Date.now()
    };

    if (existingIdx >= 0) {
      sessions[existingIdx] = sessionObj;
    } else {
      sessions.unshift(sessionObj);
    }

    localStorage.setItem('aura_sessions', JSON.stringify(sessions.slice(0, 20)));
    renderSessionList();
  }

  function renderSessionList() {
    if (!dom.sessionList) return;
    const sessions = getSavedSessions();
    dom.sessionList.innerHTML = '';

    if (!sessions.length) {
      dom.sessionList.innerHTML = '<div style="font-size:11.5px;color:var(--text-dim);padding:4px 0;">No saved sessions yet.</div>';
      return;
    }

    sessions.forEach(sess => {
      const item = document.createElement('div');
      item.className = `session-item ${sess.id === state.currentSessionId ? 'active' : ''}`;
      item.innerHTML = `
        <span class="session-title" title="${escapeHtml(sess.title)}">${escapeHtml(sess.title)}</span>
        <button class="session-delete-btn" title="Delete session">×</button>
      `;

      item.querySelector('.session-title').addEventListener('click', () => {
        loadSession(sess.id);
      });

      item.querySelector('.session-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSession(sess.id);
      });

      dom.sessionList.appendChild(item);
    });
  }

  function loadSession(id) {
    const sessions = getSavedSessions();
    const target = sessions.find(s => s.id === id);
    if (!target) return;

    state.currentSessionId = target.id;
    state.history = target.history || [];

    // Clear UI and repopulate
    dom.messages.innerHTML = '';
    state.history.forEach(turn => {
      addMessage(turn.content, turn.role === 'user' ? 'You' : 'Bot');
    });

    renderSessionList();
    sfx.play('click');
  }

  function deleteSession(id) {
    let sessions = getSavedSessions().filter(s => s.id !== id);
    localStorage.setItem('aura_sessions', JSON.stringify(sessions));
    if (state.currentSessionId === id) {
      startNewSession();
    } else {
      renderSessionList();
    }
    sfx.play('click');
  }

  function startNewSession() {
    state.currentSessionId = Date.now().toString();
    state.history = [];
    dom.messages.innerHTML = '';
    if (dom.welcomeHero) dom.welcomeHero.style.display = 'flex';
    renderSessionList();
    sfx.play('click');
  }

  function exportChatMarkdown() {
    if (!state.history.length) {
      alert('Conversation is empty. Start speaking or typing to export.');
      return;
    }

    let md = `# Aura Voice AI Conversation\n*Exported on ${new Date().toLocaleString()}*\n\n`;
    state.history.forEach(item => {
      const sender = item.role === 'user' ? 'User' : 'Aura Assistant';
      md += `### ${sender}\n${item.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    sfx.play('click');
  }

  // --- EVENT LISTENERS INITIALIZATION ---
  function initEvents() {
    // Chat form submit
    dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(dom.messageInput.value);
    });

    // Mic Button click
    dom.micButton.addEventListener('click', () => {
      toggleSpeechRecognition();
    });

    // Quick mic icon in input field
    if (dom.voiceInputQuickBtn) {
      dom.voiceInputQuickBtn.addEventListener('click', () => {
        toggleSpeechRecognition();
      });
    }

    // Stop speaking button
    if (dom.stopSpeechBtn) {
      dom.stopSpeechBtn.addEventListener('click', stopSpeaking);
    }

    // Clear current chat
    if (dom.clearChatBtn) {
      dom.clearChatBtn.addEventListener('click', () => {
        if (confirm('Clear current conversation messages?')) {
          dom.messages.innerHTML = '';
          state.history = [];
          if (dom.welcomeHero) dom.welcomeHero.style.display = 'flex';
          sfx.play('click');
        }
      });
    }

    // New Session
    if (dom.newChatBtn) {
      dom.newChatBtn.addEventListener('click', startNewSession);
    }

    // Clear all saved sessions
    if (dom.clearAllSessionsBtn) {
      dom.clearAllSessionsBtn.addEventListener('click', () => {
        if (confirm('Delete all saved sessions?')) {
          localStorage.removeItem('aura_sessions');
          startNewSession();
        }
      });
    }

    // Export chat
    if (dom.exportChatBtn) {
      dom.exportChatBtn.addEventListener('click', exportChatMarkdown);
    }

    // Auto-speak toggle
    if (dom.autoSpeak) {
      dom.autoSpeak.checked = state.autoSpeak;
      dom.autoSpeak.addEventListener('change', () => {
        state.autoSpeak = dom.autoSpeak.checked;
        localStorage.setItem('aura_auto_speak', state.autoSpeak);
        sfx.play('click');
      });
    }

    // Hands-free continuous toggle
    if (dom.handsFreeMode) {
      dom.handsFreeMode.checked = state.handsFree;
      dom.handsFreeMode.addEventListener('change', () => {
        state.handsFree = dom.handsFreeMode.checked;
        localStorage.setItem('aura_hands_free', state.handsFree);
        sfx.play('click');
      });
    }

    // SFX toggle header button
    if (dom.sfxToggleBtn) {
      dom.sfxToggleBtn.addEventListener('click', () => {
        state.sfxEnabled = !state.sfxEnabled;
        localStorage.setItem('aura_sfx', state.sfxEnabled);
        dom.sfxToggleBtn.classList.toggle('active', state.sfxEnabled);
        const onIcon = dom.sfxToggleBtn.querySelector('.sfx-on-icon');
        const offIcon = dom.sfxToggleBtn.querySelector('.sfx-off-icon');
        if (onIcon) onIcon.style.display = state.sfxEnabled ? 'block' : 'none';
        if (offIcon) offIcon.style.display = state.sfxEnabled ? 'none' : 'block';
        sfx.play('click');
      });
    }

    // Sidebar Toggle & Close
    if (dom.sidebarToggleBtn) {
      dom.sidebarToggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          dom.sidebar.classList.toggle('mobile-open');
        } else {
          dom.sidebar.classList.toggle('collapsed');
        }
        sfx.play('click');
      });
    }

    if (dom.sidebarCloseBtn) {
      dom.sidebarCloseBtn.addEventListener('click', () => {
        dom.sidebar.classList.remove('mobile-open');
      });
    }

    // Theme Modal Triggers
    if (dom.themePickerBtn) {
      dom.themePickerBtn.addEventListener('click', () => {
        dom.themeModal.classList.add('open');
        sfx.play('click');
      });
    }

    if (dom.openThemeModalBtn) {
      dom.openThemeModalBtn.addEventListener('click', () => {
        dom.themeModal.classList.add('open');
        sfx.play('click');
      });
    }

    if (dom.themeModalCloseBtn) {
      dom.themeModalCloseBtn.addEventListener('click', () => {
        dom.themeModal.classList.remove('open');
      });
    }

    // Theme Hero Cards
    document.querySelectorAll('.theme-card-mini').forEach(card => {
      card.addEventListener('click', () => {
        const themeId = card.getAttribute('data-theme-id');
        applyTheme(themeId);
      });
    });

    // Theme Catalog Card Selection
    document.querySelectorAll('.theme-catalog-card').forEach(card => {
      card.addEventListener('click', () => {
        const themeId = card.getAttribute('data-theme-id');
        applyTheme(themeId);
        dom.themeModal.classList.remove('open');
      });
    });

    // Settings Modal Triggers
    if (dom.settingsModalOpenBtn) {
      dom.settingsModalOpenBtn.addEventListener('click', () => {
        dom.settingsModal.classList.add('open');
        sfx.play('click');
      });
    }

    if (dom.settingsModalCloseBtn) {
      dom.settingsModalCloseBtn.addEventListener('click', () => {
        dom.settingsModal.classList.remove('open');
      });
    }

    if (dom.saveSettingsBtn) {
      dom.saveSettingsBtn.addEventListener('click', () => {
        // Save speech rate & pitch
        state.speechRate = parseFloat(dom.speechRate.value);
        state.speechPitch = parseFloat(dom.speechPitch.value);
        state.speechVoiceURI = dom.voiceSelect.value;
        state.bgParticles = dom.bgParticlesToggle.checked;
        state.sfxEnabled = dom.sfxAudioToggle.checked;
        state.customPrompt = dom.customSystemPrompt.value.trim();

        localStorage.setItem('aura_speech_rate', state.speechRate);
        localStorage.setItem('aura_speech_pitch', state.speechPitch);
        localStorage.setItem('aura_voice_uri', state.speechVoiceURI);
        localStorage.setItem('aura_particles', state.bgParticles);
        localStorage.setItem('aura_sfx', state.sfxEnabled);
        localStorage.setItem('aura_custom_prompt', state.customPrompt);

        dom.settingsModal.classList.remove('open');
        sfx.play('click');
      });
    }

    if (dom.resetSettingsBtn) {
      dom.resetSettingsBtn.addEventListener('click', () => {
        dom.speechRate.value = '1.0';
        dom.speechRateVal.textContent = '1.0x';
        dom.speechPitch.value = '1.0';
        dom.speechPitchVal.textContent = '1.0';
        dom.voiceSelect.value = '';
        dom.bgParticlesToggle.checked = true;
        dom.sfxAudioToggle.checked = true;
        dom.customSystemPrompt.value = '';
        sfx.play('click');
      });
    }

    // Sliders dynamic value label updates
    if (dom.speechRate) {
      dom.speechRate.value = state.speechRate;
      dom.speechRateVal.textContent = `${state.speechRate}x`;
      dom.speechRate.addEventListener('input', () => {
        dom.speechRateVal.textContent = `${dom.speechRate.value}x`;
      });
    }

    if (dom.speechPitch) {
      dom.speechPitch.value = state.speechPitch;
      dom.speechPitchVal.textContent = state.speechPitch;
      dom.speechPitch.addEventListener('input', () => {
        dom.speechPitchVal.textContent = dom.speechPitch.value;
      });
    }

    if (dom.customSystemPrompt) {
      dom.customSystemPrompt.value = state.customPrompt;
    }

    // Personas Selector
    if (dom.personaSelector) {
      dom.personaSelector.querySelectorAll('.persona-chip').forEach(btn => {
        const personaKey = btn.getAttribute('data-persona');
        if (personaKey === state.persona) {
          btn.classList.add('active');
          if (dom.activePersonaBadge) dom.activePersonaBadge.textContent = btn.querySelector('.persona-name').textContent;
        }

        btn.addEventListener('click', () => {
          dom.personaSelector.querySelectorAll('.persona-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.persona = personaKey;
          localStorage.setItem('aura_persona', personaKey);
          if (dom.activePersonaBadge) dom.activePersonaBadge.textContent = btn.querySelector('.persona-name').textContent;
          sfx.play('click');
        });
      });
    }

    // Ambient Soundscapes Chips
    if (dom.soundscapeChips) {
      dom.soundscapeChips.querySelectorAll('.sound-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          dom.soundscapeChips.querySelectorAll('.sound-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const soundType = btn.getAttribute('data-sound');
          soundscapeEngine.start(soundType);
          sfx.play('click');
        });
      });
    }

    // Soundscape Volume Slider
    if (dom.soundscapeVolume) {
      dom.soundscapeVolume.value = state.soundscapeVolume;
      dom.soundscapeVolumeVal.textContent = `${Math.round(state.soundscapeVolume * 100)}%`;
      dom.soundscapeVolume.addEventListener('input', () => {
        const val = parseFloat(dom.soundscapeVolume.value);
        dom.soundscapeVolumeVal.textContent = `${Math.round(val * 100)}%`;
        soundscapeEngine.setVolume(val);
      });
    }

    // Quick Prompts
    document.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const promptText = chip.getAttribute('data-prompt');
        if (promptText) {
          sendMessage(promptText);
        }
      });
    });

    // Dismiss Error
    if (dom.dismissErrorBtn) {
      dom.dismissErrorBtn.addEventListener('click', hideError);
    }

    // Keydown shortcuts: Spacebar to talk, Escape to close modals
    window.addEventListener('keydown', (e) => {
      // Escape closes modals
      if (e.key === 'Escape') {
        dom.themeModal.classList.remove('open');
        dom.settingsModal.classList.remove('open');
      }

      // Spacebar push-to-talk (only when not typing in text field)
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      if (e.code === 'Space' && !isInputActive && !state.spaceKeyHeld) {
        state.spaceKeyHeld = true;
        e.preventDefault();
        startSpeechRecognition();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && state.spaceKeyHeld) {
        state.spaceKeyHeld = false;
        // Keep listening or let final result commit
      }
    });

    // Close modals on clicking backdrop
    [dom.themeModal, dom.settingsModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });

    // Initial first message speak / copy triggers
    const initialGreeting = document.getElementById('initialBotGreeting');
    if (initialGreeting) {
      const spk = initialGreeting.querySelector('.speak-msg-btn');
      if (spk) {
        spk.addEventListener('click', () => {
          const txt = initialGreeting.querySelector('.assistant-bubble p').textContent;
          speakText(txt);
        });
      }
      const cpy = initialGreeting.querySelector('.copy-msg-btn');
      if (cpy) {
        cpy.addEventListener('click', () => {
          const txt = initialGreeting.querySelector('.assistant-bubble p').textContent;
          navigator.clipboard.writeText(txt);
          cpy.title = 'Copied!';
          setTimeout(() => cpy.title = 'Copy message', 1500);
        });
      }
    }
  }

  // --- BOOTSTRAP APP ---
  function init() {
    applyTheme(state.theme);
    particles.init();
    visualizer.init();
    renderSessionList();
    initEvents();

    // Check backend status
    fetch('/api/config')
      .then(res => res.json())
      .then(cfg => {
        if (cfg.model) {
          const modelBadge = document.getElementById('modelStatusLabel');
          if (modelBadge) modelBadge.textContent = `${cfg.model}`;
        }
      })
      .catch(() => {});
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();