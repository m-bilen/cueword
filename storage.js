export async function getThreads(){
    const result = await chrome.storage.local.get('threads');
    return result.threads ?? [];
}

export async function createThread(title){
const newThread = {
    id: crypto.randomUUID(),
    title: title,
    createdAt: Date.now()
};
const threads = await getThreads();
threads.unshift(newThread);
await chrome.storage.local.set({threads: threads});
return newThread;
}

async function getAllWords() {
    const result = await chrome.storage.local.get('words');
    return result.words ?? [];

}

export async function getWords(threadId) {
    const words = await getAllWords();
    return words.filter(word => word.threadId === threadId);
}

export async function addWord(threadId, text, analysis) {
    const newWord = {
        id: crypto.randomUUID(),
        threadId: threadId,
        text: text,
        analysis: analysis, 
        createdAt: Date.now()
    };
    const words = await getAllWords();
    words.push(newWord);
    await chrome.storage.local.set({words: words});
    return newWord;
}

export async function getApiKey() {
    const result = await chrome.storage.local.get('geminiApiKey');
    return result.geminiApiKey ?? '';
}

export async function saveApiKey(key){
    await chrome.storage.local.set({geminiApiKey: key});
}

export async function getTargetLanguage(){
    const result = await chrome.storage.local.get('targetLanguage');
    return result.targetLanguage ?? 'Turkish';

}

export async function saveTargetLanguage(language){
    await chrome.storage.local.set({ targetLanguage: language});
}

export async function deleteThread(threadId){
    const threads = await getThreads();
    const words = await getAllWords();
    await chrome.storage.local.set({
        threads: threads.filter(thread => thread.id !== threadId),
        words: words.filter(word => word.threadId !==threadId)
    });
}

export async function deleteWord(wordId){
    const words = await getAllWords();
    await chrome.storage.local.set({ words: words.filter(word => word.id !== wordId) });
    
}

export async function renameThread(threadId, newTitle){
    const threads = await getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (!thread)  return;
    
    thread.title = newTitle;
    await chrome.storage.local.set({threads: threads});

}