// clean-yt - popup.js

const DEFAULT_SETTINGS = {
  enabled: true,
  // HOMEPAGE
  hideHomepageFeed: true,
  redirectSubscriptions: false,
  hideHomeShorts: true,
  hideExploreTopics: true,
  cleanHomepageFeed: true,
  // VIDEO PAGE
  hideVideoSidebar: false,
  hideRecommendedVideos: true,
  hideVideoShorts: true,
  hidePlaylists: false,
  hideComments: false,
  hideLiveChat: true,
  hideEndScreens: false,
  disableAutoplay: true,
  // ACCORDION EXPANDED STATES
  sectionsState: {
    'section-homepage': true,
    'section-videopage': true
  }
};

const TOGGLE_KEYS = [
  'hideHomepageFeed',
  'redirectSubscriptions',
  'hideHomeShorts',
  'hideExploreTopics',
  'cleanHomepageFeed',
  'hideVideoSidebar',
  'hideRecommendedVideos',
  'hideVideoShorts',
  'hidePlaylists',
  'hideComments',
  'hideLiveChat',
  'hideEndScreens',
  'disableAutoplay'
];

// Unified storage wrapper supporting Chrome extension and browser preview
const storage = {
  get: (defaults, callback) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(defaults, callback);
    } else {
      const result = {};
      Object.keys(defaults).forEach(key => {
        try {
          const item = localStorage.getItem('clean_yt_' + key);
          result[key] = item !== null ? JSON.parse(item) : defaults[key];
        } catch (e) {
          result[key] = defaults[key];
        }
      });
      callback(result);
    }
  },
  set: (data, callback) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(data, callback);
    } else {
      Object.keys(data).forEach(key => {
        try {
          localStorage.setItem('clean_yt_' + key, JSON.stringify(data[key]));
        } catch (e) {}
      });
      if (callback) callback();
    }
  },
  onChanged: {
    addListener: (cb) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(cb);
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const masterToggle = document.getElementById('master-toggle');
  const masterStatusText = document.getElementById('master-status-text');

  // In-memory cache of user's configuration
  let savedSettings = Object.assign({}, DEFAULT_SETTINGS);
  let isExtensionActive = true;

  // Render UI: when active, restore user's last chosen states; when inactive, show all off
  function renderUI(isActive, config) {
    isExtensionActive = isActive;
    masterToggle.checked = isActive;

    if (isActive) {
      masterStatusText.textContent = 'Active';
      masterStatusText.classList.add('active');
      document.body.classList.remove('master-inactive');

      // Restore and display the user's last chosen state for each switch
      TOGGLE_KEYS.forEach(key => {
        const el = document.getElementById(key);
        if (el) {
          el.checked = config[key] !== undefined ? !!config[key] : !!DEFAULT_SETTINGS[key];
        }
      });
    } else {
      masterStatusText.textContent = 'Inactive';
      masterStatusText.classList.remove('active');
      document.body.classList.add('master-inactive');
    }
  }

  // Load all settings
  storage.get(DEFAULT_SETTINGS, (settings) => {
    savedSettings = Object.assign({}, DEFAULT_SETTINGS, settings);
    renderUI(savedSettings.enabled !== false, savedSettings);

    // Setup Accordion section expand/collapse states
    const states = settings.sectionsState || DEFAULT_SETTINGS.sectionsState;
    Object.keys(states).forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) {
        if (states[sectionId] === false) {
          section.classList.add('collapsed');
        } else {
          section.classList.remove('collapsed');
        }
      }
    });
  });

  // Handle Master toggle change
  masterToggle.addEventListener('change', (e) => {
    const isNowActive = e.target.checked;
    savedSettings.enabled = isNowActive;

    storage.set({ enabled: isNowActive }, () => {
      renderUI(isNowActive, savedSettings);
    });
  });

  // Handle individual feature toggle changes
  TOGGLE_KEYS.forEach(key => {
    const el = document.getElementById(key);
    if (!el) return;

    el.addEventListener('change', (e) => {
      const isChecked = e.target.checked;

      if (!isExtensionActive) {
        // User clicked a switch while inactive -> activate and start choosing functions!
        isExtensionActive = true;
        savedSettings.enabled = true;
        savedSettings[key] = isChecked;

        storage.set({ enabled: true, [key]: isChecked }, () => {
          renderUI(true, savedSettings);
        });
      } else {
        // Normal update while active
        savedSettings[key] = isChecked;
        storage.set({ [key]: isChecked });
      }
    });
  });

  // Accordion Header Click Listeners
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.getAttribute('data-target');
      const section = document.getElementById(targetId);
      if (!section) return;

      const isCurrentlyCollapsed = section.classList.contains('collapsed');
      if (isCurrentlyCollapsed) {
        section.classList.remove('collapsed');
      } else {
        section.classList.add('collapsed');
      }

      // Persist state
      storage.get({ sectionsState: DEFAULT_SETTINGS.sectionsState }, (data) => {
        const updated = Object.assign({}, data.sectionsState, {
          [targetId]: isCurrentlyCollapsed // now expanded (true) if was collapsed
        });
        storage.set({ sectionsState: updated });
      });
    });
  });

  // Live storage updates from other tabs
  storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;

    if (changes.enabled !== undefined) {
      savedSettings.enabled = changes.enabled.newValue;
      renderUI(changes.enabled.newValue, savedSettings);
    }

    TOGGLE_KEYS.forEach(key => {
      if (changes[key] !== undefined) {
        savedSettings[key] = changes[key].newValue;
        if (isExtensionActive) {
          const el = document.getElementById(key);
          if (el) el.checked = changes[key].newValue;
        }
      }
    });
  });
});
