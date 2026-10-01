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