# Calamytryx.github.io

Welcome to my official website! I’m calamytryx, a disaster in the matrix who likes to play games and have fun. On this website, you can find all my latest streams, videos, tweets, and fan art. You can also learn more about me and my chaotic personality and style. If you want to join me on my adventures or just hang out with me, this website is for you!

This website is made by me and my awesome fans who contribute to it. If you want to use this website, you can clone this repository and open the index.html file in your browser. If you want to contribute to this website, you can fork this repository and make a pull request with your changes. You can also report any issues or suggestions in the issues tab.

Thank you for visiting my website and supporting me. You can follow me on my social media platforms:

Twitter: @Calamytryx
Twitch: @Calamytryx
YouTube: @Calamytryx
Facebook: Calamytryx

The shared design color tokens live in `theme.css`, imported by `my_css.css` and `calamytryx_ui.css`. Keep the token source canonical there when adding tools.

The global theme selector is available across pages using the shared site stylesheet. It includes four dark themes, three light themes, a pink theme, and custom colors. Preset or custom colors are stored locally in `calamytryx.theme.v1` and synchronized with Shift and Tally. The glitch's second color is computed as the accent's color-wheel complement.

Each new tool is a single HTML file with inline tool-specific CSS and JavaScript; the shared site stylesheet and global theme script provide site-wide behavior.

Pocket Bird loads site-wide from `assets/vendor/pocket-bird/` and is precached for offline use. The vendored bundle is from IdreesInc/Pocket-Bird at revision `4c75328f8b3a4523791b4bccaec7b209d87a2c36`, is licensed under MPL-2.0 (see the included `LICENSE`), and has one local-font path change to use the site's existing Monocraft font.

`dev.kit` is a client-side hash/HMAC, AES-GCM, JWT-decoding, and secret-pattern scanning page at `/pages/projects/dev_kit.html`. Its encrypted bundles use PBKDF2-SHA-256 and AES-256-GCM; JWT decoding does not verify signatures, and scanner matches are heuristic.

`dice.mk` at `/pages/projects/dice_maker.html` rolls additive dice expressions with cryptographic randomness and calculates theoretical odds.

`codes.mk` at `/pages/projects/codes_maker.html` creates QR codes for text, URLs, email, phone, SMS, contacts, and locations; Wi-Fi QR codes; TOTP authenticator codes; and Code 39, EAN-13, and UPC-A barcodes. Its bundled QR encoder is MIT-licensed; the license notice is included in the page. TOTP secrets remain in memory in the page and are not saved.

`meta.mk` at `/pages/projects/meta_maker.html` inspects supported JPEG EXIF/GPS and PNG text metadata and re-encodes images locally to strip metadata before sharing.

`pass.mk` at `/pages/projects/pass_maker.html` generates passwords and Diceware-style passphrases with unbiased cryptographic sampling, provides the passphrase selection-entropy readout, and estimates password strength locally, including warnings for predictable word/year patterns. The passphrase word pool has 64 words rather than the standardized 7,776-word Diceware list.

`palette.mk` at `/pages/projects/palette_maker.html` compares colors using WCAG relative luminance and reports AA/AAA contrast results, including presets loaded from the shared theme tokens.

The portfolio site is mirrored into the `portfolio/` folder and is served from `https://calamytryx.github.io/portfolio`.

## Offline support

The root site can be installed as a progressive web app. Its service worker precaches the home page shell and shared home-page assets, then caches same-origin pages and assets as they are visited. Previously visited pages remain available offline; pages that have not been cached show an offline notice. Tools that load scripts or data from third-party services still need a network connection for those features. Increment the cache version suffixes in `service-worker.js` when changing the offline shell so activation removes stale caches.
