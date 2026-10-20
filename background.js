chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel?.open) {
    chrome.sidePanel.open({ tabId: tab.id });
    return;
  }
  chrome.windows.create({ url: 'sidepanel.html', type: 'popup', width: 420, height: 720 });
});