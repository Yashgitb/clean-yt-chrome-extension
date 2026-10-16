// clean-yt - content.js

const DEFAULT_SETTINGS = {
  enabled: true,
  hideHomepageFeed: true,
  redirectSubscriptions: false,
  hideHomeShorts: true,
  hideExploreTopics: true,
  cleanHomepageFeed: true,
  hideVideoSidebar: false,
  hideRecommendedVideos: true,
  hideVideoShorts: true,
  hidePlaylists: false,
  hideComments: false,
  hideLiveChat: true,
  hideEndScreens: false,
  disableAutoplay: true
};

let currentSettings = Object.assign({}, DEFAULT_SETTINGS);
let currentUrl = window.location.href;

// Initialize settings
chrome.storage.local.get(DEFAULT_SETTINGS, (data) => {
  currentSettings = Object.assign({}, DEFAULT_SETTINGS, data);
  applySettings();
});

// Apply classes and triggers based on settings
function applySettings() {
  const root = document.documentElement;
  if (!root) return;

  if (currentSettings.enabled) {
    root.classList.add('shorts-hider-active');
  } else {
    root.classList.remove('shorts-hider-active');
    removeAllFeatureClasses(root);
    return;
  }

  // Feature class mappings
  toggleHtmlClass(root, 'hide-homepage-feed', currentSettings.hideHomepageFeed);
  toggleHtmlClass(root, 'hide-home-shorts', currentSettings.hideHomeShorts);
  toggleHtmlClass(root, 'hide-explore-topics', currentSettings.hideExploreTopics);
  toggleHtmlClass(root, 'clean-homepage-feed', currentSettings.cleanHomepageFeed);
  toggleHtmlClass(root, 'hide-video-sidebar', currentSettings.hideVideoSidebar);
  toggleHtmlClass(root, 'hide-recommended-videos', currentSettings.hideRecommendedVideos);
  toggleHtmlClass(root, 'hide-video-shorts', currentSettings.hideVideoShorts);
  toggleHtmlClass(root, 'hide-playlists', currentSettings.hidePlaylists);
  toggleHtmlClass(root, 'hide-comments', currentSettings.hideComments);
  toggleHtmlClass(root, 'hide-live-chat', currentSettings.hideLiveChat);
  toggleHtmlClass(root, 'hide-end-screens', currentSettings.hideEndScreens);

  // Actions
  handleRedirections();
  handleAutoplay();
  updatePlaylistState();
}

function toggleHtmlClass(el, className, condition) {
  if (condition) {
    el.classList.add(className);
  } else {
    el.classList.remove(className);
  }
}

function removeAllFeatureClasses(root) {
  const classes = [
    'hide-homepage-feed',
    'hide-home-shorts',
    'hide-explore-topics',
    'clean-homepage-feed',
    'hide-video-sidebar',
    'hide-recommended-videos',
    'hide-video-shorts',
    'hide-playlists',
    'hide-comments',
    'hide-live-chat',
    'hide-end-screens',
    'has-active-playlist'
  ];
  classes.forEach(cls => root.classList.remove(cls));
}

// Handle Shorts URL and Subscriptions redirections
function handleRedirections() {
  if (!currentSettings.enabled) return;

  const path = window.location.pathname;

  // 1. Redirect Shorts to regular video player
  if ((currentSettings.hideHomeShorts || currentSettings.hideVideoShorts) && path.startsWith('/shorts/')) {
    const videoId = path.split('/')[2];
    if (videoId) {
      window.location.replace(`https://www.youtube.com/watch?v=${videoId}`);
      return;
    }
  }

  // 2. Redirect Homepage to Subscriptions feed if option enabled
  if (currentSettings.hideHomepageFeed && currentSettings.redirectSubscriptions) {
    if (path === '/' || path === '') {
      window.location.replace('https://www.youtube.com/feed/subscriptions');
      return;
    }
  }
}

// Turn off autoplay on video player if enabled
function handleAutoplay() {
  if (!currentSettings.enabled || !currentSettings.disableAutoplay) return;

  const autoplayToggle = document.querySelector('.ytp-autonav-toggle-button[aria-checked="true"]');
  if (autoplayToggle) {
    autoplayToggle.click();
  }
}

// Listen for dynamic storage updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'local') return;

  let hasChanged = false;
  Object.keys(currentSettings).forEach(key => {
    if (changes[key] !== undefined) {
      currentSettings[key] = changes[key].newValue;
      hasChanged = true;
    }
  });

  if (hasChanged) {
    applySettings();
  }
});

// Detect if current video is part of an active playlist
function updatePlaylistState() {
  const root = document.documentElement;
  if (!root) return;

  if (!currentSettings.enabled) {
    root.classList.remove('has-active-playlist');
    return;
  }

  let hasPlaylist = false;
  try {
    const url = new URL(window.location.href);
    const listParam = url.searchParams.get('list');
    const isWatch = url.pathname.includes('/watch');
    const hasListParam = isWatch && !!listParam && listParam.trim().length > 0;

    const watchEl = document.querySelector('ytd-watch-flexy, ytd-watch-grid');
    const hasWatchAttr = watchEl !== null && (watchEl.hasAttribute('playlist') || watchEl.hasAttribute('playlist-id'));

    const hasPlaylistItems = document.querySelector(
      'ytd-playlist-panel-renderer ytd-playlist-panel-video-renderer'
    ) !== null;

    hasPlaylist = hasListParam || hasWatchAttr || hasPlaylistItems;
  } catch (e) {
    hasPlaylist = false;
  }

  toggleHtmlClass(root, 'has-active-playlist', hasPlaylist);

  if (hasPlaylist) {
    ensurePlaylistExpanded();
  }
}

// Ensure active playlist panel is not hidden or collapsed by YouTube
function ensurePlaylistExpanded() {
  if (!currentSettings.enabled || !currentSettings.hideVideoSidebar || currentSettings.hidePlaylists) return;
  const panel = document.querySelector('ytd-playlist-panel-renderer#playlist, ytd-playlist-panel-renderer');
  if (panel) {
    if (panel.hasAttribute('hidden')) {
      panel.removeAttribute('hidden');
    }
    if (panel.hasAttribute('collapsed')) {
      panel.removeAttribute('collapsed');
    }
  }
}

// Single Page Application navigation events
window.addEventListener('yt-navigate-start', () => {
  handleRedirections();
  updatePlaylistState();
});

window.addEventListener('yt-navigate-finish', () => {
  handleRedirections();
  handleAutoplay();
  updatePlaylistState();
  // YouTube occasionally attaches the playlist panel slightly after navigate finish
  setTimeout(updatePlaylistState, 300);
  setTimeout(updatePlaylistState, 800);
});

// Mutation Observer for dynamic DOM additions and URL changes
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    handleRedirections();
    handleAutoplay();
    updatePlaylistState();
  }
});

if (document.documentElement) {
  observer.observe(document.documentElement, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}
