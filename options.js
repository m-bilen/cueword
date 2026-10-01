import {getApiKey, saveApiKey} from './storage.js';
const apiKeyInput = document.getElementById('apiKeyInput');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

apiKeyInput.value = await getApiKey();

saveBtn.addEventListener('click', async () => {

    await saveApiKey(apiKeyInput.value.trim());
    status.textContent = 'Saved';
});