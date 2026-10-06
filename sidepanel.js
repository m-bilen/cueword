import { t, applyTranslations} from './i18n.js';
import { getThreads, createThread, getWords, addWord, deleteThread, deleteWord, renameThread} from './storage.js';
import { analyze } from './ai.js'
const threadList = document.getElementById('threadList');
const chatContainer = document.getElementById('chatContainer');
const newThreadBtn = document.getElementById('newThreadBtn');


let activeThreadId = null;
let allThreads = [];
const ERROR_MESSAGE_KEYS = {
    NO_API_KEY: 'errorNoApiKey',
    INVALID_KEY: 'errorInvalidKey',
    RATE_LIMITED: 'errorRateLimited',
    NETWORK: 'errorNetwork',
    SERVER_ERROR: 'errorServer',
    EMPTY_ANSWER: 'errorEmptyAnswer'

};

async function loadThreads() {
    try {
        const threads = await getThreads();
        allThreads = threads;
       
        renderThreads(threads);
        
        if (threads.length === 0) {
            createNewThread(t('defaultThreadTitle'));
        } else if (!activeThreadId) {
            selectThread(threads[0].id);
        }
    } catch (err) { console.error("Başlıklar yüklenemedi", err); }
}


async function selectThread(threadId) {
    activeThreadId = threadId;
    

    const items = threadList.children;
    for (let item of items) { item.classList.remove('active'); }
    
    try {
       const words = await getWords(threadId);
        
        chatContainer.innerHTML = '';
        if (words.length === 0) {
            chatContainer.innerHTML = `<p class="placeholder">${t('emptyThread')}</p>`;
        } else {
            words.forEach(item => appendChatBubble(item.text, item.analysis, item.id));
            scrollToBottom();
        }
        
        renderThreads(allThreads);
    } catch (err) { console.error("Kelimeler çekilemedi", err); }
}



newThreadBtn.addEventListener('click', () => {
    const title = prompt(t('newThreadPrompt'));
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

function appendChatBubble(text, analysis, wordId) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    
    const wordDiv = document.createElement('div');
    wordDiv.className = 'chat-word';
    wordDiv.innerText = text;
    if (isLine(text)) wordDiv.classList.add('is-line');
    
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'chat-analysis';
    analysisDiv.innerText = analysis;
    
    bubble.appendChild(wordDiv);
    bubble.appendChild(createIconButton('delete-btn', '×', 'Sil', async () => {
        await deleteWord(wordId);
        bubble.remove();
    }));
    bubble.appendChild(analysisDiv);
    chatContainer.appendChild(bubble);
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TEXT_SELECTED") {
        analyzeText(message.text, message.context);
    }
});

async function analyzeText(text, context) {
    const threadId = activeThreadId;
    const placeholder = chatContainer.querySelector('.placeholder');
    if (placeholder) placeholder.remove();


    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble';
    const loadingWord = document.createElement('div');
    loadingWord.className = 'chat-word';
    loadingWord.textContent = text;
    if (isLine(text)) loadingWord.classList.add('is-line');
    const loadingText = document.createElement('div');
    loadingText.className = 'chat-analysis';
    loadingText.style.color = '#80868b';
    loadingText.style.fontStyle = 'italic';
    loadingText.textContent = t('analyzing');
    loadingBubble.appendChild(loadingWord);
    loadingBubble.appendChild(loadingText);
    chatContainer.appendChild(loadingBubble);
    scrollToBottom();

        try {
        const analysis = await analyze(text, context);
       const newWord = await addWord(threadId, text, analysis, context);

        loadingBubble.remove();
        if (activeThreadId === threadId){

        
        appendChatBubble(text, analysis, newWord.id);
        scrollToBottom();
        }
    } catch (err) {
        const messageKey = ERROR_MESSAGE_KEYS[err.message];
        if (messageKey){
            console.warn('Analysis Failed', err.message); 
        } else {
            console.error('Analysis Failed', err);
        }
        loadingWord.textContent = t('errorTitle');
        loadingText.textContent = t(messageKey ?? 'errorUnexpected');
        loadingText.style.fontStyle = 'normal';
        
    }
}

function createIconButton(className, symbol, title, onClick){
    const button = document.createElement('button');
    button.className = className;
    button.textContent = symbol;
    button.title = title;
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });
    return button;
}

function isLine(text){
    return text.trim().split(/\s+/).length >=4;
}


function renderThreads(threads){
    threadList.innerHTML = '';
    threads.forEach(thread =>{
        const li = document.createElement('li');
        li.className = 'history-item';
        if(activeThreadId === thread.id) li.classList.add ('active');
        const titleSpan = document.createElement('span');
        titleSpan.textContent = thread.title;
        li.appendChild(titleSpan);
        li.appendChild(createIconButton('rename-btn ' ,'✎', t('rename'), () => handleRenameThread(thread) ));
        li.appendChild(createIconButton('delete-btn', '×', t('delete'),() => handleDeleteThread(thread) ));
        li.addEventListener('click' , () => selectThread(thread.id));
        threadList.appendChild(li);

    });
}

async function handleDeleteThread(thread){
    const confirmed = confirm (t('deleteThreadConfirm', [thread.title]));
    if(!confirmed) return;
    await deleteThread(thread.id);
    if (activeThreadId === thread.id) activeThreadId = null;
    await loadThreads();

}

async function handleRenameThread(thread) {
    const newTitle = prompt(t('newThreadPrompt'));
    if (!newTitle || newTitle.trim() === '') return;
    await renameThread(thread.id, newTitle.trim());
    await loadThreads();
}


applyTranslations();
loadThreads();