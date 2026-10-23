# shorts-hider

Clean up YouTube and spend less time on distractions with this Chrome extension. It can hide Shorts, recommendations, and other parts of YouTube.

## Install in Chrome

1. Open a terminal and clone the repository:
   ```bash
   git clone https://github.com/Yashgitb/clean-yt-chrome-extension.git
   ```
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the `clean-yt-chrome-extension` folder created by the clone. It contains `manifest.json`.
6. Open YouTube. Click the extension icon to see its settings.

## Use the extension

Use the switch at the top of the extension popup to turn all its features on or off. When it is off, your selected settings are saved. Turning it back on restores them.

The popup has two groups of settings:

### Homepage

- **Hide Homepage Feed** hides YouTube's home video feed.
- **Redirect to Subscriptions** sends you to your Subscriptions feed instead of the homepage. This works when **Hide Homepage Feed** is also on.
- **Hide YouTube Shorts** hides Shorts on the homepage and redirects Shorts pages to the regular video player.
- **Hide Explore More Topics** hides the topic buttons near the top of the page.
- **Clean Homepage Feed** hides promotional banners and ads from the homepage.

### Video Page

- **Hide Video Sidebar** hides the video sidebar. If a playlist is playing, the playlist can remain visible unless **Hide Playlists** is on.
- **Hide Recommended Videos** hides recommended videos in the sidebar.
- **Hide YouTube Shorts** hides Shorts from the video sidebar and redirects Shorts pages to the regular video player.
- **Hide Playlists** hides the playlist panel.
- **Hide Comments** hides the comments area.
- **Hide Live Chat** hides live chat.
- **Hide End Screen Cards** hides suggested cards that appear over a video at the end.
- **Disable Autoplay** turns off YouTube's next-video autoplay when the player controls are available.

Click **Homepage** or **Video Page** to expand or collapse that group of settings. Your choices are saved automatically.
