import { openReview, closeReview, getBadgeCount } from './review.js';
import { t, applyTranslations} from './i18n.js';
import {getApiKey, getThreads, createThread, getWords, addWord, deleteThread, deleteWord, renameThread,getThreadsCollapsed, saveThreadsCollapsed} from './storage.js';
import { analyze } from './ai.js'
const threadList = document.getElementById('threadList');
const chatContainer = document.getElementById('chatContainer');
const newThreadBtn = document.getElementById('newThreadBtn');
const currentThreadTitle = document.getElementById('currentThreadTitle');
const currentThreadCount = document.getElementById('currentThreadCount');
const settingsBtn = document.getElementById('settingsBtn');
const toggleThreadsBtn = document.getElementById('toggleThreadsBtn');
const reviewBtn = document.getElementById('reviewBtn');
const reviewCount = document.getElementById('reviewCount');
const reviewClose = document.getElementById('reviewClose');
const onboardingSettingsBtn = document.getElementById('onboardingSettingsBtn');


let activeThreadId = null;
let allThreads = [];
const ERROR_MESSAGE_KEYS = {
    NO_API_KEY: 'errorNoApiKey',
    INVALID_KEY: 'errorInvalidKey',
    RATE_LIMITED: 'errorRateLimited',
    NETWORK: 'errorNetwork',
    SERVER_ERROR: 'errorServer',
    EMPTY_ANSWER: 'errorEmptyAnswer',
    TIMEOUT: 'errorTimeout'

};
const MIN_WORD_SIZE = 15;

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
    wordDiv.lang = 'en';
    wordDiv.className = 'chat-word';
    wordDiv.innerText = text;
    if (isLine(text)) wordDiv.classList.add('is-line');
    
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'chat-analysis';
    renderAnalysis(analysisDiv, analysis, text);
    
    bubble.appendChild(wordDiv);
    bubble.appendChild(createIconButton('delete-btn', '×', 'Delete', async () => {
        await deleteWord(wordId);
        bubble.remove();
    }));
    bubble.appendChild(analysisDiv);
    chatContainer.appendChild(bubble);
    fitWord(wordDiv);
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TEXT_SELECTED") {
        analyzeText(message.text, message.context, {time: message.time, url: message.url});
    }
});

async function analyzeText(text, context, source) {
    const threadId = activeThreadId;
    const placeholder = chatContainer.querySelector('.placeholder');
    if (placeholder) placeholder.remove();


    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble is-loading';
    const loadingWord = document.createElement('div');
    loadingWord.className = 'chat-word';
    loadingWord.textContent = text;
    if (isLine(text)) loadingWord.classList.add('is-line');
    const loadingText = document.createElement('div');
    loadingText.className = 'chat-analysis';
    const loadingBar = document.createElement('div');
    loadingBar.className = 'loading-bar';
    const loadingLabel = document.createElement('span');
    loadingLabel.className = 'sr-only';
    loadingLabel.textContent = t('analyzing');
    loadingText.appendChild(loadingBar);
    loadingText.appendChild(loadingLabel);
    loadingBubble.appendChild(loadingWord);
    loadingBubble.appendChild(loadingText);
    chatContainer.appendChild(loadingBubble);
    fitWord(loadingWord);
    scrollToBottom();

        try {
        const analysis = await analyze(text, context);
       const newWord = await addWord(threadId, text, analysis, context, source);

        loadingBubble.remove();
        if (activeThreadId === threadId){

        
        appendChatBubble(text, analysis, newWord.id);
        scrollToBottom();
        updateHeader();
        }
    } catch (err) {
        const messageKey = ERROR_MESSAGE_KEYS[err.message];
        if (messageKey){
            console.warn('Analysis failed', err.message); 
        } else {
            console.error('Analysis failed', err);
        }
        loadingWord.textContent = t('errorTitle');
        loadingText.textContent = t(messageKey ?? 'errorUnexpected');
        loadingBubble.appendChild(createIconButton('delete-btn', '×', t('delete'), () => loadingBubble.remove()));
        
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

function fitWord(element){
    element.style.overflowWrap = 'normal';
    let size = parseFloat(getComputedStyle(element).fontSize);
    while (element.scrollWidth > element.clientWidth && size > MIN_WORD_SIZE){
        size -= 1;
        element.style.fontSize = `${size}px`;
    }
    element.style.overflowWrap = '';
}

// TODO: Use parseAnalysis from analysis.js instead of parsing lines here,
// so the analysis format is read in one place only.
function renderAnalysis(container,analysis,word) {
    const lines = analysis.split('\n').map(line => line.trim()).filter(line => line !== '');

    lines.forEach((line, index) => {
        const lineDiv = document.createElement('div');
        const repeatedPrefix = word.toLowerCase() + ':';
        if (index === 0 && line.toLowerCase().startsWith(repeatedPrefix)) {
            line = line.slice(repeatedPrefix.length).trim();
        }
        if (line.startsWith('→')) {
            const arrow = document.createElement('span');
            arrow.className = 'analysis-arrow';
            arrow.textContent = '→ ';
            lineDiv.appendChild(arrow);
            lineDiv.append(line.slice(1).trim());

        } else if (/^[-•*]\s/.test(line)) {
            lineDiv.className = 'analysis-usage';
            const content = line.slice(2);
            const colon = content.indexOf(':');
            if (colon > 0) {
                const term = document.createElement('span');
                term.className = 'usage-term';
                term.textContent = content.slice(0, colon);
                lineDiv.appendChild(term);
                lineDiv.append(content.slice(colon));
            } else {
                lineDiv.textContent = content;

            }  
        } else {
            lineDiv.textContent = line;
        }
        container.appendChild(lineDiv);
    });
}

async function updateHeader(){
    const thread = allThreads.find(item => item.id === activeThreadId);
    const count = chatContainer.querySelectorAll('.chat-bubble:not(.is-loading)').length;
    currentThreadTitle.textContent = thread ? thread.title : '';
    const label = count === 1 ? t('wordCountOne') : t('wordCount', [String(count)]);
    currentThreadCount.textContent = thread ? label : '';
    const badgeCount = await getBadgeCount(activeThreadId);
    reviewCount.textContent = badgeCount || '';
}

async function updateonboarding(){
    document.body.classList.toggle('needs-key', !(await getApiKey()));
}


function renderThreads(threads){
    threadList.innerHTML = '';
    threads.forEach(thread =>{
        const li = document.createElement('li');
        li.className = 'history-item';
        if(activeThreadId === thread.id) li.classList.add ('active');
        const titleSpan = document.createElement('span');
        titleSpan.textContent = thread.title;
        titleSpan.title = thread.title;
        li.appendChild(titleSpan);
        li.appendChild(createIconButton('rename-btn ' ,'✎', t('rename'), () => handleRenameThread(thread) ));
        li.appendChild(createIconButton('delete-btn', '×', t('delete'),() => handleDeleteThread(thread) ));
        li.addEventListener('click' , () => selectThread(thread.id));
        threadList.appendChild(li);
        

    });
    updateHeader();
}

async function handleDeleteThread(thread){
    const confirmed = confirm (t('deleteThreadConfirm', [thread.title]));
    if(!confirmed) return;
    await deleteThread(thread.id);
    if (activeThreadId === thread.id) activeThreadId = null;
    await loadThreads();

}

async function handleRenameThread(thread) {
    const newTitle = prompt(t('renamePrompt'), thread.title);
    if (!newTitle || newTitle.trim() === '' || newTitle.trim() === thread.title) return;
    await renameThread(thread.id, newTitle.trim());
    await loadThreads();
}

settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
onboardingSettingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
toggleThreadsBtn.addEventListener('click', async () => {
    const collapsed = document.body.classList.toggle('threads-collapsed');
    await saveThreadsCollapsed(collapsed);
});

reviewBtn.addEventListener('click', () => openReview(activeThreadId));
reviewClose.addEventListener('click', () => {
  closeReview();
  updateHeader();
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.words || changes.reviewDay) updateHeader();
    if (changes.geminiApiKey) updateonboarding();
});
if (await getThreadsCollapsed()) document.body.classList.add('threads-collapsed');

applyTranslations();
updateonboarding();
loadThreads();