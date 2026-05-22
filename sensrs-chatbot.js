/**
 * SEnSRS Support Agent Chatbot Widget
 * 
 * USAGE:
 * 1. Add this script to your website's HTML:
 *    <script src="sensrs-chatbot.js"></script>
 * 
 * 2. Initialize with your Gemini API key:
 *    <script>
 *      SEnSRSChat.init({
 *        geminiApiKey: '',
 *        websiteUrl: 'https://sensrs.com/'  // optional, defaults to this
 *      });
 *    </script>
 * 
 * The chatbot will:
 * - Appear as a floating button in the bottom-right corner
 * - Fetch content from the SEnSRS website on first open
 * - Answer questions using Gemini AI based on that content
 */

(function () {
  'use strict';

  function getLogoSvg(size = 36) {
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="display: block; flex-shrink: 0;">
        <!-- Circular badge borders -->
        <circle cx="50" cy="50" r="47" fill="#ffffff" stroke="#124e33" stroke-width="2.5"/>
        <circle cx="50" cy="50" r="41" fill="none" stroke="#bd9233" stroke-width="1.2"/>
        
        <!-- Top Text (Straight, highly compatible, modern) -->
        <text x="50" y="20" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="5.2" fill="#1e293b" text-anchor="middle" letter-spacing="0.5">CENTRE OF EXCELLENCE</text>
        
        <!-- Core Logo Graphics in the Center -->
        <!-- Three Blue Waves -->
        <path d="M 22,66 Q 36,62 50,66 T 78,66" fill="none" stroke="#3d8da8" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 20,72 Q 35,68 50,72 T 80,72" fill="none" stroke="#3d8da8" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 22,78 Q 36,74 50,78 T 78,78" fill="none" stroke="#3d8da8" stroke-width="2.5" stroke-linecap="round"/>
        
        <!-- Mustard Gold Hill -->
        <path d="M 18,60 Q 34,47 52,54 T 82,59 L 80,64 Q 65,59 50,59 T 20,64 Z" fill="#bd9233"/>
        
        <!-- Pine Tree 1 (Left) -->
        <rect x="37" y="42" width="1.6" height="9" fill="#124e33"/>
        <polygon points="29,42 38,32 47,42" fill="#124e33"/>
        <polygon points="31,35 38,26 45,35" fill="#124e33"/>
        <polygon points="33,28 38,20 43,28" fill="#124e33"/>
        
        <!-- Pine Tree 2 (Center) -->
        <rect x="49" y="43" width="1.8" height="10" fill="#124e33"/>
        <polygon points="38,43 50,31 62,43" fill="#124e33"/>
        <polygon points="41,34 50,23 59,34" fill="#124e33"/>
        <polygon points="44,26 50,15 56,26" fill="#124e33"/>
        
        <!-- Pine Tree 3 (Right) -->
        <rect x="61" y="42" width="1.6" height="9" fill="#124e33"/>
        <polygon points="53,42 62,32 71,42" fill="#124e33"/>
        <polygon points="55,35 62,26 69,35" fill="#124e33"/>
        <polygon points="57,28 62,20 67,28" fill="#124e33"/>
        
        <!-- Bottom Text (Straight, highly compatible, modern) -->
        <text x="50" y="87" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="5.8" fill="#124e33" text-anchor="middle" letter-spacing="0.5">SEnSRS - IIT ROPAR</text>
      </svg>`;
  }

  const SENSRS_LOGO = getLogoSvg(36);
  const DEFAULT_WEBSITE_URL = 'https://sensrs.com/';

  let config = {};
  let websiteContent = '';
  let isFetchingContent = false;
  let messages = [];
  let isOpen = false;
  let isTyping = false;

  const FALLBACK_CONTENT = `
SEnSRS (Sensors, Networks and Systems Research) is a Centre of Excellence at IIT Ropar (Indian Institute of Technology Ropar), located in Rupnagar, Punjab, India.

Key Information:
- Full Name: SEnSRS - Centre of Excellence in Sensors, Networks and Systems Research
- Institution: IIT Ropar (Indian Institute of Technology Ropar)
- Location: Rupnagar, Punjab, India
- Website: https://sensrs.com/

About IIT Ropar:
IIT Ropar was established in 2008 by the Ministry of Education, Government of India. It is a premier technical university located in Rupnagar, Punjab, India. The Director is Prof. Rajeev Ahuja. The campus spans 525 acres in an urban setting.

SEnSRS Research Focus:
- Sensor technologies and networks
- Environmental monitoring systems
- IoT (Internet of Things) applications
- Signal processing
- Embedded systems
- Wireless sensor networks
- AI and machine learning for sensing applications

Centre of Excellence:
IIT Ropar has been named as a Centre of Excellence in Artificial Intelligence under the Ministry of Education, Government of India's initiative, specifically focusing on AI for agriculture — integrating AI technologies to transform agricultural practices.

Contact & Location:
- IIT Ropar, Rupnagar, Punjab - 140001, India
- Website: https://sensrs.com/

Research Areas:
- Wearable sensors and health monitoring
- Agricultural sensor systems
- Environmental sensing
- Smart sensing systems
- Network protocols for sensor systems
`;

  function createStyles() {
    const style = document.createElement('style');
    style.id = 'sensrs-chatbot-styles';
    style.textContent = `
      #sensrs-chat-widget * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      #sensrs-chat-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #0f5132;
        border: 3px solid #c8a84b;
        cursor: pointer;
        z-index: 999998;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
        overflow: hidden;
      }

      #sensrs-chat-fab:hover {
        transform: scale(1.08);
      }

      #sensrs-chat-fab .fab-icon-open,
      #sensrs-chat-fab .fab-icon-close {
        position: absolute;
        transition: opacity 0.2s, transform 0.2s;
      }

      #sensrs-chat-fab .fab-icon-close {
        opacity: 0;
        transform: rotate(-90deg);
        font-size: 24px;
        color: white;
        font-weight: 300;
        line-height: 1;
      }

      #sensrs-chat-fab.open .fab-icon-open {
        opacity: 0;
        transform: rotate(90deg);
      }

      #sensrs-chat-fab.open .fab-icon-close {
        opacity: 1;
        transform: rotate(0deg);
      }

      #sensrs-chat-window {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 370px;
        height: 580px;
        border-radius: 20px;
        background: #ffffff;
        z-index: 999997;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.25);
        transform: scale(0.85) translateY(30px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
        transform-origin: bottom right;
      }

      #sensrs-chat-window.open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: all;
      }

      .sensrs-header {
        background: #0f5132;
        padding: 0;
        display: flex;
        flex-direction: column;
        color: white;
      }

      .sensrs-header-top {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
        justify-content: space-between;
      }

      .sensrs-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
      }

      .sensrs-header-logo {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: white;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .sensrs-header-title {
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.2px;
        color: white;
        font-family: inherit;
      }

      .sensrs-header-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: rgba(255,255,255,0.85);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transition: background 0.15s, color 0.15s;
        line-height: 1;
      }

      .sensrs-header-btn:hover {
        background: rgba(255,255,255,0.15);
        color: white;
      }

      .sensrs-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #ffffff;
      }

      .sensrs-messages::-webkit-scrollbar {
        width: 5px;
      }
      .sensrs-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      .sensrs-messages::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.1);
        border-radius: 3px;
      }

      /* Welcome Banner styling */
      .sensrs-welcome-banner {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px 10px 10px 10px;
        text-align: center;
      }

      .sensrs-welcome-logo {
        width: 80px;
        height: 80px;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sensrs-welcome-title {
        font-size: 20px;
        font-weight: 600;
        color: #202124;
        margin-bottom: 24px;
        font-family: inherit;
      }

      .sensrs-welcome-date {
        font-size: 13px;
        color: #70757a;
        font-weight: 500;
        margin-bottom: 12px;
        letter-spacing: 0.5px;
      }

      .msg-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        width: 100%;
        margin-bottom: 4px;
      }

      .msg-row.user {
        justify-content: flex-end;
      }

      .msg-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: white;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        margin-top: 2px; /* aligns beautifully with the top edge of bubble */
      }

      .msg-bubble {
        max-width: 78%;
        padding: 14px 18px;
        border-radius: 18px;
        font-size: 14.5px;
        line-height: 1.6;
        position: relative;
        word-wrap: break-word;
        overflow-wrap: break-word;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }

      .msg-bubble.bot {
        background: #f1f3f4;
        color: #202124;
        border-bottom-left-radius: 4px;
        margin-left: 2px;
      }

      .msg-bubble.user {
        background: #0f5132;
        color: #ffffff;
        border-bottom-right-radius: 4px;
        margin-right: 4px;
      }

      .typing-bubble {
        background: #f1f3f4;
        border-radius: 18px;
        border-bottom-left-radius: 4px;
        padding: 12px 18px;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }

      .typing-dot {
        width: 7px;
        height: 7px;
        background: #80868b;
        border-radius: 50%;
        animation: typingBounce 1.2s infinite;
      }

      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes typingBounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
        40% { transform: translateY(-6px); opacity: 1; }
      }

      /* Scroll-down floating button */
      .sensrs-scroll-down-btn {
        position: absolute;
        bottom: 84px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #ffffff;
        border: none;
        box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: #5f6368;
        z-index: 10;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s, transform 0.2s, background 0.15s;
      }

      .sensrs-scroll-down-btn.show {
        opacity: 1;
        pointer-events: all;
        transform: translateX(-50%) translateY(0);
      }

      .sensrs-scroll-down-btn:hover {
        background: #f8f9fa;
        color: #202124;
      }

      .sensrs-input-area {
        background: #ffffff;
        padding: 12px 16px 20px 16px; /* increased bottom padding to prevent rounded bottom-corner clipping */
        display: flex;
        align-items: center;
        gap: 12px;
        border-top: 1px solid #f1f3f4;
        position: relative;
      }

      .sensrs-input-wrap {
        flex: 1;
        background: #ffffff;
        border: 2px solid #0f5132;
        border-radius: 26px;
        display: flex;
        align-items: center;
        padding: 6px 14px 6px 18px;
        gap: 8px;
        min-height: 48px;
        transition: border-color 0.2s, box-shadow 0.2s;
      }

      .sensrs-input-wrap:focus-within {
        border-color: #146c43;
        box-shadow: 0 0 0 1px #146c43;
      }

      .sensrs-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14.5px;
        color: #202124;
        resize: none;
        max-height: 80px;
        height: 22px;
        line-height: 22px;
        padding: 0;
        font-family: inherit;
        display: block;
      }

      .sensrs-input::placeholder {
        color: #80868b;
      }

      .sensrs-mic-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 20px;
        padding: 4px;
        transition: transform 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .sensrs-mic-btn:hover {
        transform: scale(1.15);
      }

      .sensrs-send-btn {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: #0f5132;
        border: none;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(15, 81, 50, 0.3);
        font-size: 20px;
        padding-left: 3px;
        line-height: 1;
      }

      .sensrs-send-btn:hover {
        background: #146c43;
      }

      .sensrs-send-btn:active {
        transform: scale(0.95);
      }



      @media (max-width: 420px) {
        #sensrs-chat-window {
          width: calc(100vw - 20px);
          right: 10px;
          bottom: 80px;
          height: 70vh;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createWidget() {
    const container = document.createElement('div');
    container.id = 'sensrs-chat-widget';

    container.innerHTML = `
      <button id="sensrs-chat-fab" aria-label="Open SEnSRS Support Chat">
        <span class="fab-icon-open">${getLogoSvg(36)}</span>
        <span class="fab-icon-close">✕</span>
      </button>

      <div id="sensrs-chat-window" role="dialog" aria-label="SEnSRS Support Agent">
        <div class="sensrs-header">
          <div class="sensrs-header-top">
            <div class="sensrs-header-left">
              <button class="sensrs-header-btn" id="sensrs-back-btn" title="Minimize chat" aria-label="Minimize chat">
                &lt;
              </button>
              <div class="sensrs-header-logo">${getLogoSvg(28)}</div>
              <h3 class="sensrs-header-title">SEnSRS Support Agent</h3>
            </div>
            <button class="sensrs-header-btn" id="sensrs-refresh-btn" title="Refresh conversation" aria-label="Refresh conversation">
              ↺
            </button>
          </div>
        </div>

        <div class="sensrs-messages" id="sensrs-messages"></div>

        <button id="sensrs-scroll-down-btn" class="sensrs-scroll-down-btn" title="Scroll to bottom" aria-label="Scroll to bottom">
          ↓
        </button>

        <div class="sensrs-input-area">
          <div class="sensrs-input-wrap">
            <textarea
              class="sensrs-input"
              id="sensrs-input"
              placeholder="Type your message..."
              rows="1"
              aria-label="Chat message"
            ></textarea>
            <button class="sensrs-mic-btn" aria-label="Voice input">🎙️</button>
          </div>
          <button class="sensrs-send-btn" id="sensrs-send-btn" aria-label="Send message">
            ➤
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
  }

  function formatDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  function scrollToBottom() {
    const msgsEl = document.getElementById('sensrs-messages');
    if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function getWelcomeBannerHtml() {
    return `
      <div class="sensrs-welcome-banner">
        <div class="sensrs-welcome-logo">${getLogoSvg(80)}</div>
        <h2 class="sensrs-welcome-title">SEnSRS Support Agent</h2>
        <div class="sensrs-welcome-date">${formatDate()}</div>
      </div>
    `;
  }

  function renderMessages() {
    const msgsEl = document.getElementById('sensrs-messages');
    if (!msgsEl) return;

    let html = getWelcomeBannerHtml();

    html += messages.map(m => {
      if (m.role === 'user') {
        return `
          <div class="msg-row user">
            <div class="msg-bubble user">
              ${escapeHTML(m.text)}
            </div>
          </div>`;
      } else {
        return `
          <div class="msg-row bot">
            <div class="msg-avatar">${getLogoSvg(28)}</div>
            <div class="msg-bubble bot">
              ${m.text.replace(/\n/g, '<br>')}
            </div>
          </div>`;
      }
    }).join('');

    if (isTyping) {
      html += `
        <div class="msg-row bot" id="typing-indicator">
          <div class="msg-avatar">${getLogoSvg(28)}</div>
          <div class="typing-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>`;
    }

    msgsEl.innerHTML = html;
    scrollToBottom();
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function addBotMessage(text) {
    messages.push({ role: 'bot', text });
    renderMessages();
  }

  function addUserMessage(text) {
    messages.push({ role: 'user', text });
    renderMessages();
  }

  async function fetchWebsiteContent(url) {
    if (isFetchingContent) return;
    isFetchingContent = true;

    try {
      const corsProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(corsProxy, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const html = data.contents || '';

      const tmp = document.createElement('div');
      tmp.innerHTML = html;

      ['script', 'style', 'nav', 'footer', 'header', 'iframe', 'noscript'].forEach(tag => {
        tmp.querySelectorAll(tag).forEach(el => el.remove());
      });

      const extracted = (tmp.innerText || tmp.textContent || '')
        .replace(/\s{3,}/g, '\n\n')
        .trim()
        .substring(0, 6000);

      websiteContent = extracted.length > 100 ? extracted : FALLBACK_CONTENT;
    } catch (e) {
      websiteContent = FALLBACK_CONTENT;
    }

    isFetchingContent = false;
  }

  function askLocalResponder(question) {
    const q = question.toLowerCase();

    // 1. Greetings
    if (q.match(/\b(hello|hi|hey|greetings|good morning|good afternoon|good evening)\b/)) {
      return "Welcome to SEnSRS Support! How can I help you today?";
    }

    // 2. What is SEnSRS / about
    if (q.includes("sensrs") || q.includes("what is") && (q.includes("coe") || q.includes("center") || q.includes("centre"))) {
      return "SEnSRS stands for Sensors, Networks and Systems Research. It is a Centre of Excellence at IIT Ropar, Punjab, India. Our focus is on cutting-edge research in sensor technologies, environmental monitoring, IoT applications, and signal processing.";
    }

    // 3. Location / Address
    if (q.includes("location") || q.includes("address") || q.includes("located") || q.includes("where is")) {
      return "SEnSRS is located at the Indian Institute of Technology Ropar (IIT Ropar) campus in Rupnagar, Punjab - 140001, India. The state-of-the-art campus spans 525 acres along the Satluj River.";
    }

    // 4. Research areas
    if (q.includes("research") || q.includes("areas") || q.includes("focus") || q.includes("topics")) {
      return "Our key research areas at SEnSRS include:\n- Wearable sensors and health monitoring\n- Agricultural sensor systems\n- Environmental sensing\n- Smart sensing systems\n- Embedded systems and network protocols";
    }

    // 5. Director
    if (q.includes("director") || q.includes("head") || q.includes("rajeev") || q.includes("ahuja")) {
      return "The Director of IIT Ropar is Prof. Rajeev Ahuja. Under his leadership, the institute has established several key initiatives, including naming IIT Ropar as a Centre of Excellence in AI for Agriculture.";
    }

    // 6. Website / Contact
    if (q.includes("website") || q.includes("link") || q.includes("site") || q.includes("contact") || q.includes("email") || q.includes("phone")) {
      return "You can find more detailed information on our official website at *https://sensrs.com/* ";
    }

    // 7. Admissions / Programs / Courses
    if (q.includes("program") || q.includes("course") || q.includes("admission") || q.includes("join") || q.includes("phd") || q.includes("mtech")) {
      return "IIT Ropar offers top-tier B.Tech, M.Tech, and Ph.D. programs. SEnSRS actively supports advanced research opportunities for students. For the latest admission notifications and eligibility criteria, please refer to the Academics section on *https://sensrs.com/*.";
    }

    // 8. Thanks
    if (q.match(/\b(thank|thanks|helpful|cool|awesome|great)\b/)) {
      return "You're very welcome! Let me know if there's anything else about SEnSRS or IIT Ropar I can help you with.";
    }

    // 9. Default smart response using fallback content
    return "That's a great question! SEnSRS is the Centre of Excellence in Sensors, Networks and Systems Research at IIT Ropar, focusing on wearable sensors, smart agriculture, IoT, and environmental sensing. For highly specific details regarding your query, please visit our official website at *https://sensrs.com/* or contact the department office directly.";
  }

  async function askGemini(userQuestion) {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
      // If no API key configured, use local responder directly
      return askLocalResponder(userQuestion);
    }

    const siteContent = websiteContent || FALLBACK_CONTENT;

    const systemPrompt = `You are the SEnSRS Support Agent, a friendly and knowledgeable assistant for the SEnSRS (Sensors, Networks and Systems Research) Centre of Excellence at IIT Ropar, India.

Your role is to answer questions about SEnSRS, IIT Ropar, their research, programs, and activities based on the website content below.

WEBSITE CONTENT:
${siteContent}

INSTRUCTIONS:
- Answer concisely and helpfully (2-4 sentences unless more detail is needed)
- If the question is not covered by the website content, answer based on your general knowledge about IIT Ropar and SEnSRS
- Be warm and professional
- If you don't know something, say so and suggest they contact the institute directly
- Do not make up specific facts like phone numbers, email addresses, or staff names unless found in the content`;

    const conversationHistory = messages.slice(-8).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.role === 'user' ? m.text : m.text }]
    }));

    conversationHistory.push({
      role: 'user',
      parts: [{ text: userQuestion }]
    });

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 400
      }
    };

    // Use stable v1 API version for robust compatibility
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // If API fails due to quota or invalid key, trigger fallback local responder seamlessly
      console.warn(`[SEnSRS Chat] Gemini API error (${res.status}). Falling back to local smart responder.`);
      return askLocalResponder(userQuestion);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || askLocalResponder(userQuestion);
  }

  async function handleSend() {
    const input = document.getElementById('sensrs-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text || isTyping) return;

    input.value = '';
    input.style.height = '22px';

    addUserMessage(text);

    if (!websiteContent && !isFetchingContent) {
      await fetchWebsiteContent(config.websiteUrl || DEFAULT_WEBSITE_URL);
    }

    isTyping = true;
    renderMessages();

    try {
      const reply = await askGemini(text);
      isTyping = false;
      addBotMessage(reply);
    } catch (e) {
      console.warn(`[SEnSRS Chat] Exception during send:`, e);
      isTyping = false;
      addBotMessage(askLocalResponder(text));
    }
  }

  function openChat() {
    isOpen = true;
    const win = document.getElementById('sensrs-chat-window');
    const fab = document.getElementById('sensrs-chat-fab');
    if (win) win.classList.add('open');
    if (fab) fab.classList.add('open');

    if (messages.length === 0) {
      addBotMessage("Welcome to SEnSRS. How may I help you today?");
      setTimeout(() => addBotMessage("May I know your name?"), 700);
    }

    if (!websiteContent && !isFetchingContent) {
      fetchWebsiteContent(config.websiteUrl || DEFAULT_WEBSITE_URL);
    }

    setTimeout(() => {
      const input = document.getElementById('sensrs-input');
      if (input) input.focus();
    }, 300);
  }

  function closeChat() {
    isOpen = false;
    const win = document.getElementById('sensrs-chat-window');
    const fab = document.getElementById('sensrs-chat-fab');
    if (win) win.classList.remove('open');
    if (fab) fab.classList.remove('open');
  }

  function resetConversation() {
    messages = [];
    isTyping = false;
    renderMessages();
    setTimeout(() => {
      addBotMessage("Welcome to SEnSRS. How may I help you today?");
      setTimeout(() => addBotMessage("May I know your name?"), 700);
    }, 100);
  }

  function bindEvents() {
    const fab = document.getElementById('sensrs-chat-fab');
    const sendBtn = document.getElementById('sensrs-send-btn');
    const input = document.getElementById('sensrs-input');
    const refreshBtn = document.getElementById('sensrs-refresh-btn');
    const backBtn = document.getElementById('sensrs-back-btn');
    const msgsEl = document.getElementById('sensrs-messages');
    const scrollDownBtn = document.getElementById('sensrs-scroll-down-btn');

    if (fab) fab.addEventListener('click', () => isOpen ? closeChat() : openChat());
    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (refreshBtn) refreshBtn.addEventListener('click', resetConversation);
    if (backBtn) backBtn.addEventListener('click', closeChat);

    if (msgsEl && scrollDownBtn) {
      msgsEl.addEventListener('scroll', () => {
        const threshold = 100;
        const isScrolledUp = msgsEl.scrollHeight - msgsEl.clientHeight - msgsEl.scrollTop > threshold;
        if (isScrolledUp) {
          scrollDownBtn.classList.add('show');
        } else {
          scrollDownBtn.classList.remove('show');
        }
      });

      scrollDownBtn.addEventListener('click', () => {
        scrollToBottom();
      });
    }

    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });

      input.addEventListener('input', () => {
        input.style.height = '22px';
        input.style.height = Math.min(input.scrollHeight, 80) + 'px';
      });
    }
  }

  window.SEnSRSChat = {
    init(options) {
      if (document.getElementById('sensrs-chat-widget')) return;

      config = {
        geminiApiKey: options.geminiApiKey || '',
        websiteUrl: options.websiteUrl || DEFAULT_WEBSITE_URL
      };

      createStyles();
      createWidget();
      bindEvents();

      if (config.websiteUrl) {
        fetchWebsiteContent(config.websiteUrl);
      }

      console.log('[SEnSRS Chat] Initialized. Ready for actions.');
    },

    destroy() {
      const widget = document.getElementById('sensrs-chat-widget');
      const styles = document.getElementById('sensrs-chatbot-styles');
      if (widget) widget.remove();
      if (styles) styles.remove();
      messages = [];
      websiteContent = '';
      config = {};
    },

    open: openChat,
    close: closeChat
  };

})();