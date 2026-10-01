import {getApiKey} from './storage.js';
const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
function buildPrompt(text){
    return  `Sana bir İngilizce kelime, phrasal verb veya dizi repliği vereceğim: "${text}".
        ilk olarak kelimenin sözlük anlamını söyle. Doğrudan filtresiz ve dobra bir üslupla:
        - Eğer ki bir cümle verilirse cümlede bazı çok kullanılmayan veya popüler olsa da seviyesi yüksek diyebileceğimiz kelimelerin tek başına anlamlarını da ayrıca yaz.
        - Varsa "at stake" örneğindeki gibi en popüler phrasal verb halini ekle.
        Maksimum 2 veya 3 çok kısa maddede işi bitir. Aşırı kısa ve net ol.`;
}

export async function analyze(text) {
    const apiKey = await getApiKey();
    if(!apiKey) throw new Error('No API key set');
    const res = await fetch(GEMINI_URL ,{
        method: 'POST',
        headers: {
         'Content-type': 'application/json',
         'x-goog-api-key': apiKey   
        },
        body: JSON.stringify({
            contents: [{parts: [{text: buildPrompt(text)}]}]
        })
    });

    if(!res.ok) throw new Error(`Gemini Request Failed: ${res.status}`);
    
    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if(!answer) throw new Error('Gemini returned an empty answer');
    return answer.trim();
}
