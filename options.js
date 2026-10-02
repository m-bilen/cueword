import {getApiKey, saveApiKey, getTargetLanguage, saveTargetLanguage} from './storage.js';
const apiKeyInput = document.getElementById('apiKeyInput');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');
const languageSelect = document.getElementById('languageSelect');


apiKeyInput.value = await getApiKey();
languageSelect.value = await getTargetLanguage();

saveBtn.addEventListener('click', async () => {

    await saveApiKey(apiKeyInput.value.trim());
    await saveTargetLanguage(languageSelect.value);
    status.textContent = 'Saved';
});