import {t, applyTranslations} from './i18n.js';
import {getApiKey, saveApiKey, getTargetLanguage, saveTargetLanguage} from './storage.js';
const apiKeyInput = document.getElementById('apiKeyInput');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');
const languageSelect = document.getElementById('languageSelect');
applyTranslations();


apiKeyInput.value = await getApiKey();
languageSelect.value = await getTargetLanguage();

saveBtn.addEventListener('click', async () => {

    await saveApiKey(apiKeyInput.value.trim());
    await saveTargetLanguage(languageSelect.value);
    status.textContent = t('saved');
});