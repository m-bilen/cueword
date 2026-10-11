import { getWords, getAllWords} from './storage.js';
import { isDue } from './srs.js';
import { parseAnalysis} from './analysis.js'

const MAX_WORDS_IN_CARD = 5;

export function isReviewable(word){
    if (word.text.split(' ').length > MAX_WORDS_IN_CARD) return false;
    return parseAnalysis(word.analysis).basic !== '';
}

export async function getDueWords(threadId){
    const words = threadId ? await getWords(threadId) : await getAllWords();
    return words.filter(word => isReviewable(word) && isDue(word));

}

export async function openReview(threadId) {
    document.body.classList.add('reviewing');
}

export function closeReview() {
    document.body.classList.remove('reviewing');
}