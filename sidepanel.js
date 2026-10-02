import { getThreads, createThread, getWords, addWord} from './storage.js';
import { analyze } from './ai.js'
const threadList = document.getElementById('threadList');
const chatContainer = document.getElementById('chatContainer');
const newThreadBtn = document.getElementById('newThreadBtn');
const BACKEND_URL = 'http://localhost:3000/api';

let activeThreadId = null;
let allThreads = [];
const ERROR_MESSAGES = {
    NO_API_KEY: 'API key eklenmemiş. Eklenti ayarlarından ekleyin.',
    INVALID_KEY: 'API key geçersiz. ayarlardan tekrar deneyin.',
    RATE_LIMITED: 'Çok hızlı istek gönderildi. Birkaç saniye bekleyip tekrar deneyin.',
    NETWORK: 'Bağlantı sorunu. İnternetinizi kontrol edip tekrar deneyin.',
    SERVER_ERROR: 'Gemini şu anda yanıt veremiyor. Biraz sonra tekrar deneyin.',
    EMPTY_ANSWER: 'Gemini boş bir cevap döndürdü. Lütfen tekrar deneyin.'

}

// 1. Sol taraftaki başlıkları veritabanından yükle
async function loadThreads() {
    try {
        const threads = await getThreads();
        allThreads = threads;
       
        renderThreads(threads);
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
       const words = await getWords(threadId);
        
        chatContainer.innerHTML = '';
        if (words.length === 0) {
            chatContainer.innerHTML = `<p class="placeholder">Bu başlık henüz boş. Altyazı seçtikçe buraya akacak...</p>`;
        } else {
            words.forEach(item => appendChatBubble(item.text, item.analysis));
            scrollToBottom();
        }
        
        // Aktif başlığı sidebar'da işaretle
        renderThreads(allThreads);
    } catch (err) { console.error("Kelimeler çekilemedi", err); }
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
        const newThread = await createThread(title)
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
        analyzeText(message.text, message.context);
    }
});

async function analyzeText(text, context) {
    const placeholder = chatContainer.querySelector('.placeholder');
    if (placeholder) placeholder.remove();

    // Geçici yükleniyor baloncuğu
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble';
    loadingBubble.innerHTML = `<div class="chat-word">${text}</div><div class="chat-analysis" style="color: #80868b; font-style: italic;">Gemini analiz ediyor...</div>`;
    chatContainer.appendChild(loadingBubble);
    scrollToBottom();

        try {
        const analysis = await analyze(text, context);
        await addWord(activeThreadId, text, analysis);

        loadingBubble.remove();
        appendChatBubble(text, analysis);
        scrollToBottom();
    } catch (err) {
        console.error('Analysis failed:', err);
        const message = ERROR_MESSAGES[err.message] ?? 'Beklenmeyen bir hata oluştu.';
        loadingBubble.innerHTML = `<div class="chat-word">Hata</div><div class="chat-analysis">${message}</div>`;
    }
}

function renderThreads(threads){
    threadList.innerHTML = '';
    threads.forEach(thread =>{
        const li = document.createElement('li');
        li.className = 'history-item';
        if(activeThreadId === thread.id) li.classList.add ('active');
        li.innerText = thread.title;
        li.addEventListener('click' , () => selectThread(thread.id));
        threadList.appendChild(li);

    });
}

loadThreads();