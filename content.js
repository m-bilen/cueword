// This checks whether the alt key is pressed
let isAltHeld = false;
const SUBTITLE_CONTAINERS = '.jw-captions, .vjs-text-track-display, .vjs-text-track-cue, [class*= "subtitle"], .player-timedtext';
const TEXT_BLOCKS = 'p, li, td, blockquote, h1, h2, h3, h4, h5, h6';


const dynamicStyle = document.createElement("style");
document.documentElement.appendChild(dynamicStyle);

function disableSelectMode() {
  dynamicStyle.innerHTML = "";
  isAltHeld = false;
}

window.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Alt") {
      isAltHeld = true;
      dynamicStyle.innerHTML = `
            /* Altyazı katmanını zorla en üste çek ve seçilebilir yap */
            .jw-captions, .jw-wrapper, .vjs-text-track-display, .vjs-text-track-cue, [class*="caption"], [class*="subtitle"], [class*="player-timedtext"], .player-timedtext * {
                pointer-events: auto !important;
                user-select: text !important;
                -webkit-user-select: text !important;
                z-index: 2147483647 !important;
            }
            /* Video oynatıcının tıklamaları yutmasını engelle */
            video, .jw-video, [data-uia = "player"]> * , .vjs-tech, .jw-controls, .jw-control-bar, .jw-overlay {
                pointer-events: none !important;
            }
        `;
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

window.addEventListener("blur", disableSelectMode);

function getSurroundingText(selection){
  const startElement = selection.anchorNode?.parentElement;
  if (!startElement) return null;
  const box = startElement.closest(SUBTITLE_CONTAINERS) ?? startElement.closest(TEXT_BLOCKS);
  if(!box) return null;
  return box.innerText.replace(/\s+/g, ' ').trim();
}

function findSentence(fullText, selectedText){
  const index = fullText.indexOf(selectedText);
  if(!index === -1) return null;
  const segmenter = new Intl.Segmenter(undefined, {granularity: 'sentence'});
  const sentences = segmenter.segment(fullText);

  for(const part of sentences) {
    const start = part.index;
    const end = part.index + part.segment.length;
    if (index >= start && index < end) {
      return part.segment.trim();
    }
  }
  return null;
}

window.addEventListener(
  "mouseup",
  (e) => {
    if (!e.altKey) return;

    let selection = window.getSelection();
    let selectedText = selection ? selection.toString().replace(/\s+/g, ' ').trim() : "";

    const surroundingText = getSurroundingText(selection);
    let context = surroundingText ? findSentence(surroundingText, selectedText) : null;
    if (context && selectedText.length >= context.length * 0.8) context = null;

    if (selectedText.length > 0 && selectedText.length < 300) {
      if (!chrome.runtime?.id) return;
      chrome.runtime.sendMessage({ type: "TEXT_SELECTED", text: selectedText , context: context});
    }
    
  },
  true,
);



function blockPageMouseEvents(e) {
  if (!isAltHeld) return;
  e.stopImmediatePropagation();
}
window.addEventListener("mousedown", blockPageMouseEvents, true);

window.addEventListener("pointerdown", blockPageMouseEvents, true);

window.addEventListener("selectstart", blockPageMouseEvents, true);

window.addEventListener("click", blockPageMouseEvents, true);
