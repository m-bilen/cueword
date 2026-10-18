
import {getApiKey, getTargetLanguage} from './storage.js';
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 5000;
const RETRY_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 1000;
function buildPrompt(text, context, targetLanguage){
    const contextPart = context
    ? `It appears in this sentence: "${context}"
First work out what the selected text means in THIS sentence. Film and TV dialogue is full of idioms, phrasal verbs and slang, so check whether the selection is part of one before you use the dictionary meaning. Example: in "You killed it out there!", "killed" means did very well, not murdered.
Because a sentence is given, use this format instead of the formats below:
<selected text>: <its basic dictionary meaning in a few words>
→ <its meaning in THIS sentence. Write this line whenever the meaning here differs from the basic meaning, even slightly.>
- <its most common phrasal verb, idiom or usage>: <meaning in a few words>
Do not translate the whole sentence.`
    : '';
    return  `You are a subtitle dictionary for a language learner watching a film or series.
Selected text: "${text}"
${contextPart}

 Answer in ${targetLanguage}, using the correct letters and special characters of that language.
Be extremely short, like quick study notes.
If the selection is a word or short phrase, use exactly this format:
<meaning in a few words>
- <its most common phrasal verb, idiom or usage>: <meaning in a few words>
- <another very common one, only if it really exists>: <meaning>

If the selection is a sentence, use exactly this format:
<natural translation>
- <hardest word or phrase in it>: <meaning in a few words>

Example for "stake" (in Turkish, only to show the format; write your own answer in ${targetLanguage}):
pay, hisse; risk
- at stake: tehlikede, söz konusu
- stake a claim: hak iddia etmek

If the selection looks like a partially selected word, use the sentence to find the full word and explain that word.
If the selection is a person's or place's name, just say that in one line.

Rules: at most 3 lines, every line under 10 words. Plain text only. No headings, no bold, no extra explanation.`;
}

function wait (ms){
    return new Promise(resolve => setTimeout(resolve,ms));

}

async function requestGemini(apiKey, prompt, timeoutMs){
    let res;
    try{
        res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers:{
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{parts: [{text: prompt}]}]
            }),
            signal: AbortSignal.timeout(timeoutMs)
        });
    } catch(err){
        if (err.name === 'TimeoutError') throw new Error('TIMEOUT');
       throw new Error('NETWORK');
    }
    
    if(res.status === 400){
        const body = await res.json().catch(() => null);
        const keyInvalid = body?.error?.details?.some(d => d.reason === 'API_KEY_INVALID');
        throw new Error(keyInvalid ? 'INVALID_KEY' : 'BAD_REQUEST');
    }

    if(res.status === 401 || res.status === 403) throw new Error('INVALID_KEY');
    if(res.status === 429) throw new Error('RATE_LIMITED');
    if(!res.ok) throw new Error('SERVER_ERROR');
    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if(!answer) throw new Error('EMPTY_ANSWER');
    return answer.trim();
}

const RETRYABLE_ERRORS = ['NETWORK', 'RATE_LIMITED', 'SERVER_ERROR', 'TIMEOUT'];

export async function analyze(text, context){
    const apiKey = await getApiKey();
    if(!apiKey) throw new Error('NO_API_KEY');
    
    const targetLanguage = await getTargetLanguage();
    const prompt = buildPrompt(text, context, targetLanguage);
 
    try{
        return await requestGemini(apiKey, prompt, TIMEOUT_MS);
    } catch(err){
        if(!RETRYABLE_ERRORS.includes(err.message)) throw err;
        if (err.message !== 'TIMEOUT') await wait(RETRY_DELAY_MS);
        return await requestGemini(apiKey,prompt, RETRY_TIMEOUT_MS);
    }
}

