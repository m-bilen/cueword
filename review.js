import { getWords, getAllWords, updateWordSrs, getThreads, getReviewedToday, countReviewed} from './storage.js';
import { isDue, getSrs, review, qualityFromAnswer, isNew } from './srs.js';
import { parseAnalysis, shortMeaning} from './analysis.js'
import { t } from './i18n.js'

const MAX_WORDS_IN_CARD = 5;
const SESSION_SIZE = 20;
const DAILY_GOAL = 20;
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
    const due = words.filter(word => isReviewable(word) && isDue(word));
   return [...shuffle(due.filter(word => !isNew(word))), ...shuffle(due.filter(isNew))];
}

export async function getBadgeCount(threadId){
    const due = await getDueWords(threadId);
    const left = Math.max(0, DAILY_GOAL - await getReviewedToday());
    return Math.min(due.length, left);
}

function shuffle(array){
    const copy = [...array];
    for (let i = copy.length -1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function formatTime(seconds){
    if (seconds == null) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = String(seconds % 60).padStart(2, '0');
    if ( h > 0) return `${h}:${String(m).padStart(2, '0')}:${s}`;
    return `${m}:${s}`; 
}

function renderReveal(word){
    const { basic, contextual } = parseAnalysis(word.analysis);
    const reveal = document.createElement('div');
    reveal.className = 'review-reveal';

    if(contextual && basic !== contextual){
        const basicLine = document.createElement('p');
        basicLine.className = 'review-meaning';
        basicLine.textContent = basic;
        reveal.append(basicLine);
    }

    const title = session.titles.get(word.threadId);
    const time = formatTime(word.time);
    const parts = [title, time].filter(Boolean);
    if (parts.length > 0){
        const source = document.createElement('p');
        source.className = 'review-source';
        source.textContent = parts.join (' · ');
        reveal.append(source);
    }
    stage.append(reveal);
}

function showMessage(text){
    const p = document.createElement('p');
    p.className = 'review-empty';
    p.textContent = text;
    stage.replaceChildren(p);
}

function goNext(){
    session.index++;
    if (session.index >= session.queue.length){
        progress.textContent = '';
        showMessage(t('reviewDone', [String(session.correct), String(session.total)]));
        return;
    }
    renderQuestion();
}

async function startSession() {
    const threadId = scope === 'thread' ? currentThreadId: null;
    const pool = (await getAllWords()).filter(isReviewable);
    const queue = shuffle((await getDueWords(threadId)).slice(0, SESSION_SIZE));
    
      if (queue.length === 0) {
  session = null;
  progress.textContent = '';
  showMessage(t('reviewEmpty'));
  return;
}
    const meanings = new Map(pool.map(word => [word.id, shortMeaning(parseAnalysis(word.analysis))] ));
    const threads = await getThreads();
    session = { pool, meanings, queue, index: 0, total: queue.length, correct: 0, retried: new Set(), titles: new Map(threads.map(t => [t.id, t.title])), };
    renderQuestion();
}

function overlaps(a, b){
    const x = ` ${a.toLowerCase()} `;
    const y = ` ${b.toLowerCase()} `;
    return x.includes(y) || y.includes(x);
}

function buildOptions(word){
    const answer = session.meanings.get(word.id);
    const used = new Set([answer]);
    const distractors = [];
    const usedTexts = [word.text];
    for ( const other of shuffle(session.pool)) {
        if (distractors.length === 3) break;
        if (usedTexts.some(text => overlaps(text, other.text))) continue;
        const meaning = session.meanings.get(other.id);
        if (used.has(meaning)) continue;
        used.add(meaning);
        distractors.push(meaning);
        usedTexts.push(other.text);
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
    session.answered = false;

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
        button.addEventListener('click', () => answerQuestion(button));
        list.appendChild(button);
    });
    stage.appendChild(list);
    session.shownAt = Date.now();
}

async function answerQuestion(button){
    if (session.answered) return;
    session.answered = true;
    
    const word = session.queue[session.index];
    const ms = Date.now() - session.shownAt;
    const correct = button.textContent === session.answer;

    stage.querySelectorAll('.review-option').forEach(option => {
        option.disabled = true;
        if (option.textContent === session.answer) option.classList.add('is-correct');

    });
    if (!correct) button.classList.add('is-wrong');

       const firstTry = !session.retried.has(word.id);
   if (firstTry) {
        if (correct) {
            session.correct += 1;
        } else {
            session.retried.add(word.id);
            session.queue.push(word);
        }
    }

    renderReveal(word);
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'review-continue';
    next.textContent = t('reviewContinue');
    next.addEventListener('click', goNext);
    stage.append(next);
    next.focus();

    if (firstTry) {
    await updateWordSrs(word.id, review(getSrs(word), qualityFromAnswer(correct, ms)));
    await countReviewed();
}
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


