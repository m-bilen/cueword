import { getWords, getAllWords} from './storage.js';
import { isDue } from './srs.js';
import { parseAnalysis, shortMeaning} from './analysis.js'
import { t } from './i18n.js'

const MAX_WORDS_IN_CARD = 5;
const SESSION_SIZE = 20;
const stage = document.getElementById('reviewStage');
const progress = document.getElementById('reviewProgress');
const scopeButtons = document.querySelectorAll('.review-scope button');

let currentThreadId = null;
let scope = 'thread';
let session = null;

export function isReviewable(word){
    if (word.text.split(' ').length > MAX_WORDS_IN_CARD) return false;
    return parseAnalysis(word.analysis).basic !== '';
}

export async function getDueWords(threadId){
    const words = threadId ? await getWords(threadId) : await getAllWords();
    return words.filter( word => isReviewable(word) && isDue(word));
}

function shuffle(array){
    const copy = [...array];
    for (let i = copy.length -1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j] = copy[j], copy[i]];
    }
    return copy;
}

async function startSession() {
    const words = scope === 'thread' ? await getWords(currentThreadId) : await getAllWords();
    const pool = words.filter(isReviewable);
    const queue = shuffle(pool.filter( word => isDue(word))).slice(0, SESSION_SIZE);
    
    if (queue.length === 0) {
        session = null;
        progress.textContent = '';
        stage.innerHTML = '';
        const empty = document.createElement('p');
        empty.className = 'review-empty';
        empty.textContent = t('reviewEmpty');
        stage.appendChild(empty);
        return ;
    }
    const meanings = new Map(pool.map(word => [word.id, shortMeaning(parseAnalysis(word.analysis))] ));
    session = { pool, meanings, queue, index: 0};
    renderQuestion();
}

function buildOptions(word){
    const answer = session.meanings.get(word.id);
    const used = new Set([answer]);
    const distractors = [];
    for ( const other of shuffle(session.pool)) {
        if (distractors.length === 3) break;
        const meaning = session.meanings.get(other.id);
        if (used.has(meaning)) continue;
        used.add(meaning);
        distractors.push(meaning);
    }
    return { answer, options: shuffle([answer, ...distractors])};
}

function renderContext(context, text){
    const p = document.createElement('p');
    p.className = 'review-context';
    const i = context.toLowerCase().indexOf(text.toLowerCase());
    const mark = document.createElement('mark');
    mark.textContent = context.slice(i, i + text.length);
    p.append(context.slice(0, i), mark, context.slice(i + text.length));
    return p;
}

function renderQuestion(){
    const word = session.queue[session.index];
    const { answer, options} = buildOptions(word);
    session.answer = answer;

    progress.textContent = `${session.index + 1} / ${session.queue.length}`;
    stage.innerHTML = '';

    const hasContext = word.context && word.context.toLowerCase().includes(word.text.toLowerCase());
    if (hasContext) {
        stage.appendChild(renderContext(word.context, word.text));
    } else {
        const big = document.createElement('p');
        big.className = 'review-word';
        big.textContent = word.text;
        stage.appendChild(big);
    }

    const prompt = document.createElement('p');
    prompt.className = 'review-prompt';
    prompt.textContent = t('reviewPrompt');
    stage.appendChild(prompt);
    
    const list = document.createElement('div');
    list.className = 'review-options';
    options.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'review-option';
        button.textContent = option;
        list.appendChild(button);
    });
    stage.appendChild(list);
}

function updateScopeButtons() {
    scopeButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.scope === scope);
    });
}

scopeButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (button.dataset.scope === 'thread' && !currentThreadId) return;
        scope = button.dataset.scope;
        updateScopeButtons();
        startSession();
    });
});

export function openReview(threadId) {
    currentThreadId = threadId;
    if (!currentThreadId) scope = 'all';
    document.body.classList.add('reviewing');
    updateScopeButtons();
    startSession();
}

export function closeReview(){
    session = null;
    document.body.classList.remove('reviewing');
}


