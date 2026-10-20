const PANEL_WIDTH = 420;

async function openWindow() {
  const { panelWindowId } = await chrome.storage.session.get('panelWindowId');
  if (panelWindowId) {
    try {
      await chrome.windows.update(panelWindowId, { focused: true });
      return;
    } catch {
      // The window was closed; open a new one below.
    }
  }

  const current = await chrome.windows.getLastFocused();
  const panel = await chrome.windows.create({
    url: 'sidepanel.html',
    type: 'popup',
    width: PANEL_WIDTH,
    height: current.height,
    left: current.left + current.width - PANEL_WIDTH,
    top: current.top
  });
  await chrome.storage.session.set({ panelWindowId: panel.id });
}

chrome.action.onClicked.addListener((tab) => {
  if (!chrome.sidePanel?.open) {
    openWindow();
    return;
  }
  chrome.sidePanel.open({ tabId: tab.id }).catch(openWindow);
});