// YouTube Shorts Hider - popup.js

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enable-toggle');
  const statusBadge = document.getElementById('status-badge');
  const counter = document.getElementById('counter');
  const resetBtn = document.getElementById('reset-btn');

  // Load initial settings
  chrome.storage.local.get({ enabled: true, blockedCount: 0 }, (data) => {
    toggle.checked = data.enabled;
    updateStatusUI(data.enabled);
    animateCounter(0, data.blockedCount, 400);
  });

  // Handle toggle interactions
  toggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ enabled: isEnabled }, () => {
      updateStatusUI(isEnabled);
    });
  });

  // Handle reset button interactions
  resetBtn.addEventListener('click', () => {
    const currentVal = parseInt(counter.textContent) || 0;
    chrome.storage.local.set({ blockedCount: 0 }, () => {
      animateCounter(currentVal, 0, 300);
      bumpCounter();
    });
  });

  // Listen to storage changes dynamically (updates counter in real-time)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.blockedCount) {
        const oldVal = changes.blockedCount.oldValue || 0;
        const newVal = changes.blockedCount.newValue || 0;
        animateCounter(oldVal, newVal, 300);
        bumpCounter();
      }
      if (changes.enabled) {
        toggle.checked = changes.enabled.newValue;
        updateStatusUI(changes.enabled.newValue);
      }
    }
  });

  // Update Badge and visual labels
  function updateStatusUI(isEnabled) {
    if (isEnabled) {
      statusBadge.textContent = 'Active';
      statusBadge.classList.remove('disabled');
    } else {
      statusBadge.textContent = 'Inactive';
      statusBadge.classList.add('disabled');
    }
  }

  // Smooth counter animation
  function animateCounter(start, end, duration) {
    if (start === end) {
      counter.textContent = end;
      return;
    }
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.max(Math.abs(Math.floor(duration / range)), 10);
    
    const timer = setInterval(() => {
      current += increment;
      counter.textContent = current;
      if (current === end) {
        clearInterval(timer);
      }
    }, stepTime);
  }

  // Micro-animation "bump" for counter card when count updates
  function bumpCounter() {
    counter.classList.remove('bump');
    // Trigger reflow to restart CSS animation
    void counter.offsetWidth;
    counter.classList.add('bump');
    setTimeout(() => {
      counter.classList.remove('bump');
    }, 200);
  }
});
