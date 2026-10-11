const DAY = 24 * 60 * 1000;
export const DEFAULT_SRS = { reps: 0, interval: 0, ease: 2.5, due: 0};
export function getSrs(word) {
    return { ...DEFAULT_SRS, ...word.srs };
    
}

export function review(srs, quality, now = Date.now()) {
    let { reps, interval, ease } = srs;
    if ( quality >= 3) {
        if ( reps === 0 ) interval = 1;
        else if (reps === 1) interval = 6;
        else interval = Math.round(interval * ease);
        reps += 1;

    } else {
        reps = 0;
        interval = 1;
    }

    ease = ease + (0.1 - (5- quality) * (0.08 + ( 5- quality ) * 0.02 ));
    if (ease < 1.3) ease = 1.3;
    return { reps, interval, ease, due: now + interval * DAY };
}

export function qualityFromAnswer(correct, ms) {
    if (!correct) return 1;
    if ( ms < 4000) return 5;
    if ( ms < 10000) return 4;
    return 3;
}

export function isDue(word, now = Date.now()) {
    return getSrs(word).due <= now;
}

export function isLearned(word){
    return getSrs(word).interval >= 21;
}