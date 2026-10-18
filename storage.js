export async function getThreads(){
    const result = await chrome.storage.local.get('threads');
    return result.threads ?? [];
}
let writeQueue = Promise.resolve();

function enqueueWrite(task) {
    const result = writeQueue.then(task);
    writeQueue = result.catch(() => {});
    return result;
}

export async function createThread(title){
    return enqueueWrite(async () => {

    
const newThread = {
    id: crypto.randomUUID(),
    title: title,
    createdAt: Date.now()
};
const threads = await getThreads();
threads.unshift(newThread);
await chrome.storage.local.set({threads: threads});
return newThread;
});
}

export async function getAllWords() {
    const result = await chrome.storage.local.get('words');
    return result.words ?? [];

}

export async function getWords(threadId) {
    const words = await getAllWords();
    return words.filter(word => word.threadId === threadId);
}

export async function addWord(threadId, text, analysis, context, source) {
    return enqueueWrite(async () => {

    
    const newWord = {
        id: crypto.randomUUID(),
        threadId: threadId,
        text: text,
        analysis: analysis, 
        context: context ?? null,
        time: source?.time ?? null,
        url: source?.url ?? null,
        createdAt: Date.now()
    };
    const words = await getAllWords();
    words.push(newWord);
    await chrome.storage.local.set({words: words});
    return newWord;
    });
}

export async function getApiKey() {
    const result = await chrome.storage.local.get('geminiApiKey');
    return result.geminiApiKey ?? '';
}

export async function saveApiKey(key){
    await chrome.storage.local.set({geminiApiKey: key});
}

const UI_LANGUAGES = {
    tr: 'Turkish', en: 'English', es: 'Spanish', de:'German', fr: 'French', pl: 'Polish',
    it: 'Italian', pt: 'Portuguese', ru: 'Russian', ar: 'Arabic'
};

function defaultLanguage(){
    const code = chrome.i18n.getUILanguage().split('-')[0];
    return UI_LANGUAGES[code] ?? 'English';
}

export async function getTargetLanguage(){
    const result = await chrome.storage.local.get('targetLanguage');
    return result.targetLanguage ?? defaultLanguage();

}

export async function saveTargetLanguage(language){
    await chrome.storage.local.set({ targetLanguage: language});
}

export async function deleteThread(threadId){
    return enqueueWrite(async () => {

   
    const threads = await getThreads();
    const words = await getAllWords();
    await chrome.storage.local.set({
        threads: threads.filter(thread => thread.id !== threadId),
        words: words.filter(word => word.threadId !==threadId)
    });
     });
}

export async function deleteWord(wordId){
    return enqueueWrite(async () => {

   
    const words = await getAllWords();
    await chrome.storage.local.set({ words: words.filter(word => word.id !== wordId) });
     });
    
}

export async function updateWordSrs(wordId, srs){
    return enqueueWrite(async () => {
        const words = await getAllWords();
        const word = words.find(w => w.id === wordId);
        if (!word) return;
        word.srs = srs;
        await chrome.storage.local.set({ words });
    });
}

export async function renameThread(threadId, newTitle){
    return enqueueWrite(async () => {

    
    const threads = await getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (!thread)  return;
    
    thread.title = newTitle;
    await chrome.storage.local.set({threads: threads});
    });

}

export async function getThreadsCollapsed(){
    const result = await chrome.storage.local.get('threadsCollapsed');
    return result.threadsCollapsed ?? false;
}

export async function saveThreadsCollapsed(collapsed){
    await chrome.storage.local.set({ threadsCollapsed: collapsed});
}

export async function getPauseOnSelect() {
    const result = await chrome.storage.local.get('pauseOnSelect');
    return result.pauseOnSelect ?? true;
}

export async function savePauseOnSelect(enabled){
    await chrome.storage.local.set({ pauseOnSelect: enabled });
}

function today(){
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getReviewedToday(){
    const { reviewDay } = await chrome.storage.local.get('reviewDay');
    return reviewDay?.date === today() ? (reviewDay.count ?? 0) : 0;
}

export async function countReviewed() {
    return enqueueWrite(async () => {
        const count = await getReviewedToday();
        await chrome.storage.local.set({ reviewDay: { date: today(), count: count + 1}});
    });
}