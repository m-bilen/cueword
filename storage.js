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