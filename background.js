chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CAPTURE_REGION") {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
            chrome.runtime.sendMessage({
                type: "PROCESS_IMAGE",
                dataUrl: dataUrl,
                rect: message.rect,
                tabWidth: message.tabWidth // Gerçek genişliği yan panele paslıyoruz
            });
        });
    }
});