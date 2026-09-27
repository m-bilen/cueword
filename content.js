// Sayfanın en tepesine boş bir dinamik CSS katmanı açıyoruz
const dynamicStyle = document.createElement('style');
document.documentElement.appendChild(dynamicStyle);

// 1. ALT tuşuna basıldığı an sitenin koruma kalkanını indiriyoruz
window.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') {
        dynamicStyle.innerHTML = `
            /* Altyazı katmanını zorla en üste çek ve seçilebilir yap */
            .jw-captions, .jw-wrapper, .vjs-text-track-display, .vjs-text-track-cue, [class*="caption"], [class*="subtitle"] {
                pointer-events: auto !important;
                user-select: text !important;
                -webkit-user-select: text !important;
                z-index: 2147483647 !important;
            }
            /* Video oynatıcının tıklamaları yutmasını engelle */
            video, .jw-video, .vjs-tech, .jw-controls, .jw-control-bar, .jw-overlay {
                pointer-events: none !important;
            }
        `;
    }
}, true);

// 2. ALT tuşu bırakıldığı an siteyi anında orijinal ayarlarına döndürüyoruz
window.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
        dynamicStyle.innerHTML = '';
    }
}, true);

// 3. Seçim tamamlandığında metni güvenli bir şekilde havada kapıyoruz
window.addEventListener('mouseup', (e) => {
    if (!e.altKey) return; // Alt tuşuna basılı değilse site normal çalışsın

    // HATA VEREN YERİ BURADA GÜVENLİ HALE GETİRİYORUZ
    let selection = window.getSelection();
    let selectedText = selection ? selection.toString().trim() : "";

    // Eğer temizlenmiş metin gerçekten varsa ve boş değilse yan panele fırlat
    if (selectedText.length > 0 && selectedText.length < 300) {
        chrome.runtime.sendMessage({ type: "TEXT_SELECTED", text: selectedText });
    }
}, true);