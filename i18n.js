export function t(key, substitutions){
    return chrome.i18n.getMessage(key, substitutions) || key;

}

export function applyTranslations(){
    document.documentElement.lang = chrome.i18n.getUILanguage();
    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = t(element.dataset.i18n);

    });
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const text = t(element.dataset.i18nTitle);
        element.title = text;
        element.setAttribute('aria-label', text);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element =>{
        element.placeholder = t(element.dataset.i18nPlaceholder);
    });
}