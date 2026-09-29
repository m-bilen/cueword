
let isAltHeld = false;

const dynamicStyle = document.createElement('style');
document.documentElement.appendChild(dynamicStyle);

function disableSelectMode(){
    dynamicStyle.innerHTML = '';
    isAltHeld = false;
}


window.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') {
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
}, true);


window.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
        disableSelectMode();
    }
}, true);

window.addEventListener('blur', disableSelectMode);

window.addEventListener('mouseup', (e) => {
    if (!e.altKey) return; 

    
    let selection = window.getSelection();
    let selectedText = selection ? selection.toString().trim() : "";

  
    if (selectedText.length > 0 && selectedText.length < 300) {
        if (!chrome.runtime?.id) return;
        chrome.runtime.sendMessage({ type: "TEXT_SELECTED", text: selectedText });
    }
}, true);

function blockPageMouseEvents(e) {
    if (isAltHeld === false) return;
    e.stopImmediatePropagation();
}
window.addEventListener('mousedown', blockPageMouseEvents, true); 

window.addEventListener('pointerdown', blockPageMouseEvents, true);

window.addEventListener('selectstart', blockPageMouseEvents,true);

window.addEventListener('click', blockPageMouseEvents, true);

