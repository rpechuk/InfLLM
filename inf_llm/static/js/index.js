if (window.marked) {
  window.marked.setOptions({ breaks: true });
}
const chat = document.getElementById('chat');
const promptInput = document.getElementById('prompt');
const form = document.getElementById('input-row');
const loadingOverlay = document.getElementById('loading-overlay');
const stopBtn = document.getElementById('stop');
let history = [];
let currentAbortController = null;
async function checkReady() {
  try {
    const resp = await fetch('/status');
    const data = await resp.json();
    if (data.ready) {
      loadingOverlay.style.display = 'none';
      chat.style.display = '';
      form.style.display = '';
      promptInput.focus();
    } else {
      setTimeout(checkReady, 1000);
    }
  } catch {
    setTimeout(checkReady, 1000);
  }
}
checkReady();
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  div.innerHTML = `<span class="${role}">${role === 'user' ? 'You' : 'Model'}:</span> <span class="msg-content"></span>`;
  const contentSpan = div.querySelector('.msg-content');
  if (role === 'bot' && window.marked) {
    // Use marked for markdown, let marked handle newlines
    let html = window.marked.parse(text);
    // Use a <div> for markdown output
    const mdDiv = document.createElement('div');
    mdDiv.style.whiteSpace = 'pre-wrap';
    mdDiv.style.wordBreak = 'break-word';
    mdDiv.innerHTML = html;
    contentSpan.appendChild(mdDiv);
  } else {
    // Always preserve newlines for user and fallback
    const pre = document.createElement('pre');
    pre.style.margin = 0;
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.wordBreak = 'break-word';
    pre.textContent = text;
    contentSpan.appendChild(pre);
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return contentSpan;
}
form.onsubmit = async (e) => {
  e.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) return;
  // Add user message to UI only (not to history yet)
  appendMessage('user', prompt);
  promptInput.value = '';
  document.getElementById('send').disabled = true;
  stopBtn.style.display = '';
  stopBtn.disabled = false;
  // Add placeholder for bot message
  const botContent = appendMessage('bot', '');
  let botText = '';
  try {
    // Send history (without current user message)
    currentAbortController = new AbortController();
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history }),
      signal: currentAbortController.signal
    });
    if (res.body && window.ReadableStream) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          let lines = buffer.split(/\r?\n/);
          buffer = lines.pop(); // last line may be incomplete
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const token = line.slice(6);
              // Debug: log each token chunk, show whitespace/newlines explicitly
              console.log('[DEBUG] Received token chunk:', JSON.stringify(token));
              botText += token;
              // Always re-render the full message so newlines and markdown are respected
              botContent.innerHTML = '';
              if (window.marked) {
                // If the output is only whitespace/newlines, use <pre>
                if (/^[\s\n]+$/.test(botText)) {
                  const pre = document.createElement('pre');
                  pre.style.margin = 0;
                  pre.style.whiteSpace = 'pre-wrap';
                  pre.style.wordBreak = 'break-word';
                  pre.textContent = botText;
                  botContent.appendChild(pre);
                } else {
                  let html = window.marked.parse(botText);
                  botContent.innerHTML = html;
                }
              } else {
                const pre = document.createElement('pre');
                pre.style.margin = 0;
                pre.style.whiteSpace = 'pre-wrap';
                pre.style.wordBreak = 'break-word';
                pre.textContent = botText;
                botContent.appendChild(pre);
              }
              chat.scrollTop = chat.scrollHeight;
            }
          }
        }
      }
    } else {
      // Fallback: request non-streaming JSON response
      const res2 = await fetch('/chat?stream=false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history })
      });
      const data = await res2.json();
      if (data.response) {
        botText = data.response;
        botContent.innerHTML = '';
        if (window.marked) {
          // If the output is only whitespace/newlines, use <pre>
          if (/^[\s\n]+$/.test(botText)) {
            const pre = document.createElement('pre');
            pre.style.margin = 0;
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.wordBreak = 'break-word';
            pre.textContent = botText;
            botContent.appendChild(pre);
          } else {
            let html = window.marked.parse(botText);
            botContent.innerHTML = html;
          }
        } else {
          const pre = document.createElement('pre');
          pre.style.margin = 0;
          pre.style.whiteSpace = 'pre-wrap';
          pre.style.wordBreak = 'break-word';
          pre.textContent = botText;
          botContent.appendChild(pre);
        }
      } else {
        botContent.textContent = '[No response]';
      }
    }
    // After bot response, update history
    history.push({ role: 'user', content: prompt });
    history.push({ role: 'bot', content: botText });
  } catch (err) {
    if (err.name === 'AbortError') {
      botContent.textContent += '\n[Generation stopped by user]';
    } else {
      botContent.textContent = '[Network error]';
    }
  }
  document.getElementById('send').disabled = false;
  stopBtn.style.display = 'none';
  stopBtn.disabled = true;
  promptInput.focus();
  currentAbortController = null;
};
// Stop generation button handler
stopBtn.onclick = function () {
  if (currentAbortController) {
    currentAbortController.abort();
    stopBtn.disabled = true;
  }
};
// Auto-grow textarea for long input
promptInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});

// Enter submits, Shift+Enter inserts newline
promptInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
  // Shift+Enter: default behavior (newline)
});