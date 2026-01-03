/// <reference types="chrome" />

chrome.runtime.onMessage.addListener((
  message: { type: string; data?: any },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) => {
  if (message.type === "GET_AUTH_TOKEN") {
    // Return true immediately to keep channel open
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ token: result.authToken || '' });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === "SET_AUTH_TOKEN") {
    chrome.storage.local.set({ authToken: message.data.token }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
});

// Listen for tab updates to inject token from localhost
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('localhost:3000')) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const token = localStorage.getItem('git-voucher-auth-token');
        if (token) {
          // Use a unique message ID or wrap in try/catch to avoid errors if extension context is invalid
          try {
            chrome.runtime.sendMessage({ 
              type: 'SET_AUTH_TOKEN', 
              data: { token } 
            }, (_response) => {
                if (chrome.runtime.lastError) {
                    console.log('Runtime error:', chrome.runtime.lastError);
                }
            });
          } catch(e) {
             console.log('Context invalid', e);
          }
        }
      }
    }).catch(err => console.log('Script injection failed', err));
  }
});

console.log("Git Voucher background worker ready");
export {};