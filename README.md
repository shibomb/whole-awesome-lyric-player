[English](README.md) | [日本語](README_JP.md)

# Awesome Lyric Player

A beautiful lyric player for visualizing songs with synchronized text animations.
This project allows you to convert lyric files (`.srt`) and audio files (`.mp3`) into stunning, animated lyric videos directly in your browser.

see [demo](https://awesome-lyric-player.32keta.com)

## Features

- **Synchronized Lyrics**: Uses `.srt` files to perfectly time lyrics with audio.
- **Customizable Animations**: Choose from various lyric blocks (rows, words, chars) and text object animations (simple, jitter, random, bubble).
- **P5.js Integration**: Built on top of `p5.js` for powerful and flexible graphics.
- **Waveform Visualization**: Powered by `wavesurfer.js`.
- **Green Screen Support**: Defaults to a green background (`#00FF00`) for easy chroma keying in video editing software.
- **Custom Fonts**: The default configuration specifies `BIZUDPGothic-Regular.ttf`, but this file is **not included** in the repository. You must download it (or another font of your choice) and place it in the `fonts` directory.

## Project Structure

```
whole-awesome-lyric-player/
├── data/           # Place your audio (.mp3) and lyric (.srt) files here
│   └── samples/    # Sample assets
├── fonts/          # Place your font files (.ttf) here
├── img/            # Place image assets (favicon, ogp) here
├── js/             # JavaScript source files
│   ├── lib/        # Library files
│   ├── LyricBlockBasic.js
│   ├── LyricBlockCustomSample.js
│   └── sketch.js   # Main entry point and configuration
├── scripts/        # Node.js scripts (e.g. update_external_links)
└── index.html      # Main HTML file
```

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shibomb/whole-awesome-lyric-player.git
   cd whole-awesome-lyric-player
   ```

2. **Prepare your assets**:
   - **Fonts**: Download `BIZUDPGothic-Regular.ttf` and place it in the `fonts/` directory.
     - See [fonts/README.md](fonts/README.md) for download links.
   - **Audio/Lyrics**: The project comes with `data/sample_song.mp3` and `data/sample_song.srt` configured by default.
   - To use your own song:
     - Place your audio file in the `data/` directory.
     - Place your lyric file in the `data/` directory.
     - Update `ALP_CONFIG` in `js/sketch.js`.

   > **Tip**: Our timecode recording utility service, [Awesome Timecode Recorder](https://awesome-timecode-recorder.32keta.com), is a convenient tool for creating `.srt` files from `.mp3` and lyric text.

3. **Run the player**:
   - Open `index.html` in a modern web browser.
   - **Note**: Due to browser CORS policies regarding local file access, you must run this project using a local web server.
     - **VS Code**: Use the "Live Server" extension.
     - **Python**: Run `python3 -m http.server` in the directory.
     - **Node**: Run `npx http-server` in the directory.

## Usage

- **S**: Start / Pause playback
- **R**: Reset playback to start
- **B**: Toggle background transparency (for green screen)
- **M**: Toggle Mute


## Configuration

You can customize the player by editing the `ALP_CONFIG` object in `js/sketch.js`:

```javascript
const ALP_CONFIG = {
    CANVAS: {
        WIDTH: 1920,
        HEIGHT: 1080, // Classic HD resolution
        FIXED: true
    },
    STYLE: {
        BACKGROUND_COLOR: "#00FF00", // Chroma key green. Set to null for transparent.
        TEXT_FILL_COLOR: 255,
        TEXT_STROKE_COLOR: 0,
        TEXT_STROKE_WEIGHT: 2,
        FONT_FILENAME: "fonts/BIZUDPGothic-Regular.ttf",
        // ...
    },
    SONG: {
        AUDIO_FILENAME: "data/sample_song.mp3",
        LYRIC_FILENAME: "data/sample_song.srt"
    }
};
```

## Customization

You can define custom `LyricBlock` and `TextObject` classes in `js/sketch.js` or separate files to create unique animation effects.
See `js/LyricBlockBasic.js`, `js/LyricBlockCustomSample.js`, `js/lib/AwesomeLyricPlayer.js`, or existing classes in `js/sketch.js` for implementation details.

To use custom classes or the built-in classes provided in `js/LyricBlockBasic.js`, you must pass them to the `AwesomeLyricPlayer` constructor in `js/sketch.js`:

```javascript
// Player Instance
const player = new AwesomeLyricPlayer(ALP_CONFIG,
    LyricBlock_1Row,    // Specify the LyricBlock class
    TextObject_Simple   // Specify the TextObject class
);
```

### Available built-in classes:
- **LyricBlock**: 
    - Basic: `LyricBlock_1Row`, `LyricBlock_2Rows`, `LyricBlock_Words`, `LyricBlock_Chars`, `LyricBlock_CurrentWords`, `LyricBlock_CurrentChars`
    - Custom Sample: `LyricBlock_CurrentChars_LongLifetimeText`
- **TextObject**: 
    - Basic: `TextObject_Simple`, `TextObject_Jitter`, `TextObject_CityPopRandomColor`
    - Custom Sample: `TextObject_CityPopRandomColor_Star`

## Support Me
[☕️ Buy me a coffee](https://buymeacoffee.com/shibombw)

## License
This project is licensed under the PolyForm Noncommercial License 1.0.0.

### Commercial Use
If you want to use this software for commercial purposes, please contact me.

* Contact: contact@whole.jp

Copyright (c) 2026 WHOLE LLC.

---

# Sample Music
「はじまりサンプル」 "Hajimari Sample"
NEW OLD CINEMA by shibomb
Copyright (c) shibomb.

