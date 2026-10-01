import {getApiKey} from './storage.js';
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 1000;
function buildPrompt(text){
    return  `You are a subtitle dictionary for a language learner watching a film or series.
Selected text: "${text}"

Answer in Turkish, using proper Turkish characters (ç, ğ, ı, ö, ş, ü). Be extremely short, like quick study notes.

If the selection is a word or short phrase, use exactly this format:
<meaning in a few words>
- <its most common phrasal verb, idiom or usage>: <meaning in a few words>
- <another very common one, only if it really exists>: <meaning>

If the selection is a sentence, use exactly this format:
<natural translation>
- <hardest word or phrase in it>: <meaning in a few words>

Example for "stake":
pay, hisse; risk
- at stake: tehlikede, söz konusu
- stake a claim: hak iddia etmek

Rules: at most 3 lines, every line under 10 words. Plain text only. No headings, no bold, no extra explanation.`;
}

function wait (ms){
    return new Promise(resolve => setTimeout(resolve,ms));

}

async function requestGemini(apiKey,text){
    let res;
    try{
        res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers:{
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{parts: [{text: buildPrompt(text)}]}]
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
    } catch(err){
       throw new Error('NETWORK');
    }
    
    if(res.status === 400 || res.status === 401 || res.status === 403) throw new Error('INVALID_KEY');
    if(res.status === 429) throw new Error('RATE_LIMITED');
    if(!res.ok) throw new Error('SERVER_ERROR');
    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if(!answer) throw new Error('EMPTY_ANSWER');
    return answer.trim();
}

const RETRYABLE_ERRORS = ['NETWORK', 'RATE_LIMITED', 'SERVER_ERROR'];

export async function analyze(text){
    const apiKey = await getApiKey();
    if(!apiKey) throw new Error('NO_API_KEY');

    try{
        return await requestGemini(apiKey,text);
    } catch(err){
        if(!RETRYABLE_ERRORS.includes(err.message)) throw err;
        await wait(RETRY_DELAY_MS);
        return await requestGemini(apiKey,text);
    }
}

