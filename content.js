// YouTube Shorts Hider - content.js

let enabled = true;
let pendingCount = 0;
let saveTimeout = null;
let currentUrl = window.location.href;

// Initialize state
chrome.storage.local.get({ enabled: true }, (data) => {
  enabled = data.enabled;
  updateHtmlClass();
  if (enabled) {
    checkAndRedirect();
    countAndHideElements();
  }
});

// Update root HTML class to activate CSS rules
function updateHtmlClass() {
  if (enabled) {
    document.documentElement.classList.add('shorts-hider-active');
  } else {
    document.documentElement.classList.remove('shorts-hider-active');
  }
}

// Redirect client if they land on or click a Shorts URL
function checkAndRedirect() {
  if (!enabled) return;

  const path = window.location.pathname;
  if (path.startsWith('/shorts/')) {
    const videoId = path.split('/')[2];
    if (videoId) {
      // Increment blocked count by 1 for the page redirect
      chrome.storage.local.get({ blockedCount: 0 }, (countData) => {
        chrome.storage.local.set({ blockedCount: countData.blockedCount + 1 });
      });

      // Redirect immediately to standard watch page
      window.location.replace(`https://www.youtube.com/watch?v=${videoId}`);
    }
  }
}

// Count and mark Shorts elements in the DOM to update stats in the popup
function countAndHideElements() {
  if (!enabled) return;

  // Selectors targeting Shorts containers and elements
  const selectors = [
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-shelf-renderer',
    'ytd-rich-item-renderer:has(a[href^="/shorts/"])',
    'ytd-video-renderer:has(a[href^="/shorts/"])',
    'ytd-compact-video-renderer:has(a[href^="/shorts/"])',
    'ytd-grid-video-renderer:has(a[href^="/shorts/"])',
    'ytm-reel-shelf-renderer',
    'ytm-pivot-bar-item-renderer[tab-id="FEshorts"]'
  ];

  let foundNew = 0;
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(`${selector}:not([data-shorts-counted])`);
      elements.forEach(el => {
        el.setAttribute('data-shorts-counted', 'true');
        foundNew++;
      });
    } catch (e) {
      // Fallback in case browser version doesn't support complex CSS selectors
    }
  });

  if (foundNew > 0) {
    pendingCount += foundNew;
    if (saveTimeout) clearTimeout(saveTimeout);
    
    // Batch and save to storage to prevent rate limiting
    saveTimeout = setTimeout(() => {
      chrome.storage.local.get({ blockedCount: 0 }, (countData) => {
        chrome.storage.local.set({ blockedCount: countData.blockedCount + pendingCount }, () => {
          pendingCount = 0;
        });
      });
    }, 300);
  }
}

// Listen for dynamic storage changes (e.g. from Popup toggle)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.enabled) {
    enabled = changes.enabled.newValue;
    updateHtmlClass();
    if (enabled) {
      checkAndRedirect();
      countAndHideElements();
    }
  }
});

// Intercept YouTube SPA (Single Page Application) navigation
window.addEventListener('yt-navigate-start', checkAndRedirect);
window.addEventListener('yt-navigate-finish', () => {
  checkAndRedirect();
  countAndHideElements();
});

// Setup MutationObserver to detect dynamic page changes (URL updates and dynamic AJAX loading of Shorts panels)
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    checkAndRedirect();
  }
  if (enabled) {
    countAndHideElements();
  }
});

// Start observing when document is ready
if (document.documentElement) {
  observer.observe(document.documentElement, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}
