
let isAltHeld = false;
let pauseOnSelect = true;
chrome.storage.local.get('pauseOnSelect').then((result) => {
  pauseOnSelect = result.pauseOnSelect ?? true;
});
chrome.storage.onChanged.addListener((changes) => {
  if(changes.pauseOnSelect) {
    pauseOnSelect = changes.pauseOnSelect.newValue;
  }
});
const SUBTITLE_CONTAINERS = '.jw-captions, .vjs-text-track-display, .vjs-text-track-cue, [class*= "subtitle"], .player-timedtext, .caption-window';
const TEXT_BLOCKS = 'p, li, td, blockquote, h1, h2, h3, h4, h5, h6';


const dynamicStyle = document.createElement("style");
document.documentElement.appendChild(dynamicStyle);

function disableSelectMode() {
  dynamicStyle.innerHTML = "";
  isAltHeld = false;
}

function enableSelectMode(){
  if (isAltHeld) return;
  isAltHeld = true;
  dynamicStyle.innerHTML = ` /* Force the subtitle layer on top and make it selectable */
            .jw-captions, .jw-wrapper, .vjs-text-track-display, .vjs-text-track-cue, [class*="caption"], [class*="subtitle"], [class*="player-timedtext"], .player-timedtext * {
                pointer-events: auto !important;
                user-select: text !important;
                -webkit-user-select: text !important;
                -webkit-user-drag: none !important;
                z-index: 2147483647 !important;
            }
            /*Stop the video player from swallowing clicks */
            video, .jw-video, [data-uia = "player"]> * , .vjs-tech, .jw-controls, .jw-control-bar, .jw-overlay {
                pointer-events: none !important;
            }`;
}

window.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Alt") {
      enableSelectMode();
    }
  },
  true,
);

window.addEventListener(
  "keyup",
  (e) => {
    if (e.key === "Alt") {
      disableSelectMode();
    }
  },
  true,
);

window.addEventListener("mousemove", (e) => {
  if (e.altKey && !isAltHeld) enableSelectMode();
  else if(!e.altKey && isAltHeld) disableSelectMode();
}, true);

window.addEventListener("blur", disableSelectMode);

function getSurroundingText(selection){
  const startElement = selection.anchorNode?.parentElement;
  if (!startElement) return null;
  const box = startElement.closest(SUBTITLE_CONTAINERS) ?? startElement.closest(TEXT_BLOCKS);
  if(!box) return null;
  return box.innerText.replace(/\s+/g, ' ').trim();
}

const WORD_CHAR = /[\p{L}\p{N}'’]/u;
function expandToWords(selection){
  if (!selection || selection.rangeCount === 0) return "";
  const range = selection.getRangeAt(0);
  let text = selection.toString();

  const start = range.startContainer;
  if (start.nodeType === Node.TEXT_NODE) {
    const s = start.textContent;
    let i = range.startOffset;
    if (WORD_CHAR.test(s[i] ?? "")) {
      while (i > 0 && WORD_CHAR.test(s[i-1])) i--;
      text = s.slice(i, range.startOffset) + text;
    }
  }

  const end = range.endContainer;
  if (end.nodeType === Node.TEXT_NODE) {
    const s = end.textContent;
    let j = range.endOffset;
    if (j > 0 && WORD_CHAR.test(s[j-1])) {
      while (j < s.length && WORD_CHAR.test(s[j])) j++;
      text = text + s.slice(range.endOffset, j);
    }
  }
  return text;
}

function cleanSubtitleText(text){
  return text
  .replace(/\[[^\]]*\]/g, ' ')
  .replace(/[♪♫]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

}

function trimPunctuation(text){
 const trimmed = text
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}.?!…'’]+$/u, '');
  return trimmed.includes(' ') ? trimmed : trimmed.replace(/[.?!…]+$/u, '');
}

function isAllCaps(text){
   const letters = text.replace(/[^\p{L}]/gu, '');
  return letters.length > 0 && letters === letters.toUpperCase();
}

function normalizeCase(text, capsLine = false) {
  const letters = text.replace(/[^\p{L}]/gu, '');
  if (!capsLine && letters.length <= 4) return text;
  if (!isAllCaps(text)) return text;

  let result = text.toLowerCase();
  if (result.includes(' ')) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
    result = result.replace(/\bi\b/g, 'I');
  }
  return result;
}

const ABBREVIATIONS = /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St)\.$/;
function findSentence(fullText, selectedText){
  const index = fullText.indexOf(selectedText);
  if(index === -1) return null;
  const segmenter = new Intl.Segmenter(undefined, {granularity: 'sentence'});
  const parts = [...segmenter.segment(fullText)];
  const i = parts.findIndex(part => index >= part.index && index < part.index + part.segment.length);
  if (i === -1) return null;
  let sentence = parts[i].segment.trim();
  let start = i;
  while(start > 0 && ABBREVIATIONS.test(parts[start -1 ].segment.trim())){
    start --;
    sentence = parts[start].segment.trim() + ' ' + sentence;
  }
 
  
  let end = i;
  while (end < parts.length -1 && ABBREVIATIONS.test(parts[end].segment.trim())){
    end++;
    sentence = sentence + ' ' + parts[end].segment.trim();
  }

  return sentence;
}

window.addEventListener(
  "mouseup",
  (e) => {
    if (!e.altKey) return;

    let selection = window.getSelection();
    let selectedText = trimPunctuation(cleanSubtitleText(expandToWords(selection)));

    const surroundingText = getSurroundingText(selection);
    let context = surroundingText ? findSentence(cleanSubtitleText(surroundingText), selectedText) : null;
    if (context && selectedText.length >= context.length * 0.8) context = null;

    if (selectedText.length > 0 && selectedText.length < 300) {
      if (!chrome.runtime?.id) return;
      const capsLine = surroundingText ? isAllCaps(surroundingText) : false;
   chrome.runtime.sendMessage({
  type: "TEXT_SELECTED",
  text: normalizeCase(selectedText, capsLine),
  context: context ? normalizeCase(context, true) : null,
  time: getVideoTime(),
  url: location.href
}).catch(() => {});
    }
    
  },
  true,
);

function pausevideos() {
  document.querySelectorAll("video").forEach((video) => {
    if (!video.paused) video.pause();
  });
}

function getVideoTime(){
  let best = null;
  let bestArea = 0;
  document.querySelectorAll("video").forEach((video) => {
    const rect = video.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area > bestArea) {
      best = video;
      bestArea = area;
    }
  });
  return best ? Math.floor(best.currentTime) : null;
}

function blockPageMouseEvents(e) {
  if (e.altKey && !isAltHeld) enableSelectMode();
  if (!isAltHeld) return;
  if (e.type === "mousedown" && pauseOnSelect) pausevideos();
  e.stopImmediatePropagation();
}
window.addEventListener("mousedown", blockPageMouseEvents, true);

window.addEventListener("pointerdown", blockPageMouseEvents, true);

window.addEventListener("selectstart", blockPageMouseEvents, true);

window.addEventListener("click", blockPageMouseEvents, true);

function blockDrag(e){
  if (!isAltHeld) return;
  e.preventDefault();
  e.stopImmediatePropagation();

}
window.addEventListener("dragstart", blockDrag, true);
