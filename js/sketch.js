/*!
 * awesome-lyric-player
 * Copyright (c) 2026 WHOLE LLC.
 * Licensed under the PolyForm Noncommercial License 1.0.0
 */

// Configuration
const ALP_CONFIG = {
    CANVAS: {
        WIDTH: 1920,
        HEIGHT: 1080,
        FIXED: true
    },
    STYLE: {
        BACKGROUND_COLOR: "#00FF00", // "#00FF00" or null to use transparent background
        TEXT_FILL_COLOR: 255,
        TEXT_STROKE_COLOR: 0,
        TEXT_STROKE_WEIGHT: 2,
        TEXT_ALPHA_DISABLED: 100,
        TEXT_ALPHA_ENABLED: 255,
        FONT_FILENAME: "fonts/BIZUDPGothic-Regular.ttf", // Font file required. put [fontname].ttf in the fonts folder.
        FONT_SIZE_RATIO: 15,
        FONT_SIZE_MIN: 30,
        FONT_SIZE_MAX: 80
    },
    SONG: {
        // AUDIO_FILENAME: "data/empty12min.mp3",
        AUDIO_FILENAME: "data/sample_song.mp3",
        LYRIC_FILENAME: "data/sample_song.srt"
    }
};

// ---------------------------------------------
// Custom Lyric Block implementation
// ---------------------------------------------

// Implement your own LyricBlock class and TextObject class here
// see awesomeLyricBlockBasic.js for more details


// ---------------------------------------------
// main
// ---------------------------------------------

// Player Instance
const player = new AwesomeLyricPlayer(ALP_CONFIG,
    // ----------------------------
    // LyricBlockClass
    // ----------------------------
    // - basic
    LyricBlock_1Row
    // LyricBlock_Words
    // LyricBlock_Chars
    // LyricBlock_2Rows
    // LyricBlock_CurrentWords
    // LyricBlock_CurrentChars
    // - custom
    // LyricBlock_CurrentChars_LongLifetimeText
    ,
    // ----------------------------
    // TextObjectClass
    // ----------------------------
    // - basic
    TextObject_Simple
    // TextObject_Jitter
    // TextObject_CityPopRandomColor
    // - custom
    // TextObject_CityPopRandomColor_Star
);

// p5.js Hooks
function setup() {
    player.setup();
    player.loadResources();
}

function draw() {
    player.drawBackground();

    // You can insert custom drawing logic here

    player.drawLyrics();

    // ----------------------------
    // Update and draw objs
    // ----------------------------
    for (let obj of player.objs) {
        obj.update();
    }

    player.objs = player.objs.filter(obj => obj.isLive);

    for (let obj of player.objs) {
        obj.draw();
    }

}

function keyPressed() {
    const result = player.handleKeyPressed();
    if (result === 'RESET') {
        player.objs = [];
    }
    return result;
}

function windowResized() {
    player.handleWindowResized();
}
