const threadList = document.getElementById('threadList');
const chatContainer = document.getElementById('chatContainer');
const newThreadBtn = document.getElementById('newThreadBtn');
const BACKEND_URL = 'http://localhost:3000/api';

let activeThreadId = null;

// 1. Sol taraftaki başlıkları veritabanından yükle
async function loadThreads() {
    try {
        const res = await fetch(`${BACKEND_URL}/threads`);
        const threads = await res.json();
        threadList.innerHTML = '';
        
        threads.forEach(thread => {
            const li = document.createElement('li');
            li.className = 'history-item';
            if (activeThreadId === thread.id) li.classList.add('active');
            li.innerText = thread.title;
            li.addEventListener('click', () => selectThread(thread.id));
            threadList.appendChild(li);
        });

        // Hiç başlık yoksa otomatik bir tane aç
        if (threads.length === 0) {
            createNewThread("Genel Oturum");
        } else if (!activeThreadId) {
            selectThread(threads[0].id);
        }
    } catch (err) { console.error("Başlıklar yüklenemedi", err); }
}

// 2. Seçilen başlığı aktif et ve içindeki geçmiş kelimeleri ekrana diz
async function selectThread(threadId) {
    activeThreadId = threadId;
    
    // Aktif sınıfını görsel olarak güncellemek için listeyi sessizce yenile
    const items = threadList.children;
    for (let item of items) { item.classList.remove('active'); }
    
    try {
        const res = await fetch(`${BACKEND_URL}/threads/${threadId}/words`);
        const words = await res.json();
        
        chatContainer.innerHTML = '';
        if (words.length === 0) {
            chatContainer.innerHTML = `<p class="placeholder">Bu başlık henüz boş. Altyazı seçtikçe buraya akacak...</p>`;
        } else {
            words.forEach(item => appendChatBubble(item.text, item.analysis));
            scrollToBottom();
        }
        
        // Aktif başlığı sidebar'da işaretle
        loadThreadsWithoutReset();
    } catch (err) { console.error("Kelimeler çekilemedi", err); }
}

function loadThreadsWithoutReset() {
    fetch(`${BACKEND_URL}/threads`).then(res => res.json()).then(threads => {
        threadList.innerHTML = '';
        threads.forEach(thread => {
            const li = document.createElement('li');
            li.className = 'history-item';
            if (activeThreadId === thread.id) li.classList.add('active');
            li.innerText = thread.title;
            li.addEventListener('click', () => selectThread(thread.id));
            threadList.appendChild(li);
        });
    });
}

// 3. Manuel Yeni Başlık Açma Butonu
newThreadBtn.addEventListener('click', () => {
    const title = prompt("Başlık adı ne olsun? (Örn: Breaking Bad S01E03):");
    if (title && title.trim() !== "") {
        createNewThread(title.trim());
    }
});

async function createNewThread(title) {
    try {
        const res = await fetch(`${BACKEND_URL}/threads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        });
        const newThread = await res.json();
        activeThreadId = newThread.id;
        await loadThreads();
        selectThread(newThread.id);
    } catch (err) { console.error("Başlık oluşturulamadı", err); }
}

// 4. Ekrana Yeni Mesaj Baloncuğu Ekleme
function appendChatBubble(text, analysis) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    
    const wordDiv = document.createElement('div');
    wordDiv.className = 'chat-word';
    wordDiv.innerText = text;
    
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'chat-analysis';
    analysisDiv.innerText = analysis;
    
    bubble.appendChild(wordDiv);
    bubble.appendChild(analysisDiv);
    chatContainer.appendChild(bubble);
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 5. Altyazı Seçildiğinde Çalışacak Tetikleyici
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TEXT_SELECTED") {
        analyzeText(message.text);
    }
});

async function analyzeText(text) {
    const placeholder = chatContainer.querySelector('.placeholder');
    if (placeholder) placeholder.remove();

    // Geçici yükleniyor baloncuğu
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble';
    loadingBubble.id = 'loading-bubble';
    loadingBubble.innerHTML = `<div class="chat-word">${text}</div><div class="chat-analysis" style="color: #80868b; font-style: italic;">Gemini analiz ediyor...</div>`;
    chatContainer.appendChild(loadingBubble);
    scrollToBottom();

    try {
        const res = await fetch(`${BACKEND_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, thread_id: activeThreadId })
        });
        const data = await res.json();
        
        const loader = document.getElementById('loading-bubble');
        if (loader) loader.remove();

        appendChatBubble(data.text, data.analysis);
        scrollToBottom();
    } catch (err) {
        const loader = document.getElementById('loading-bubble');
        if (loader) loader.innerHTML = `<div class="chat-word">Hata</div><div class="chat-analysis">Motor bağlantısı koptu.</div>`;
    }
}

loadThreads();