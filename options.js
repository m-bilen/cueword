import {t, applyTranslations} from './i18n.js';
import {getApiKey, saveApiKey, getTargetLanguage, saveTargetLanguage, getPauseOnSelect, savePauseOnSelect} from './storage.js';
const apiKeyInput = document.getElementById('apiKeyInput');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');
const languageSelect = document.getElementById('languageSelect');
const pauseCheckbox = document.getElementById('pauseOnSelect');
applyTranslations();


apiKeyInput.value = await getApiKey();
languageSelect.value = await getTargetLanguage();
pauseCheckbox.checked = await getPauseOnSelect();

saveBtn.addEventListener('click', async () => {

    await saveApiKey(apiKeyInput.value.trim());
    await saveTargetLanguage(languageSelect.value);
    await savePauseOnSelect(pauseCheckbox.checked);
    status.textContent = t('saved');
    setTimeout(() => { status.textContent = ''; }, 2000);
});