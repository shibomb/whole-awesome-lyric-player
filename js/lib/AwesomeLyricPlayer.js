/*! 
 * awesome-lyric-player
 * Copyright (c) 2026 WHOLE LLC.
 * Licensed under the PolyForm Noncommercial License 1.0.0
 */

function formatTime(ms) {
    if (ms < 0) ms = 0;
    let totalSeconds = Math.floor(ms / 1000);
    let milliseconds = Math.floor(ms % 1000);
    let seconds = totalSeconds % 60;
    let minutes = Math.floor(totalSeconds / 60) % 60;
    let hours = Math.floor(totalSeconds / 3600);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Executes p5.js drawing commands for a set of path commands.
 * Does not include push/pop or translate.
 */
function executePathCommands(pathCommands) {
    if (!pathCommands || pathCommands.length === 0) return;

    beginShape();
    for (let cmd of pathCommands) {
        const type = cmd.type || cmd[0];
        switch (type) {
            case "M":
                endContour();
                beginContour();
                vertex((cmd.x !== undefined ? cmd.x : cmd[1]), (cmd.y !== undefined ? cmd.y : cmd[2]));
                break;
            case "L":
                vertex((cmd.x !== undefined ? cmd.x : cmd[1]), (cmd.y !== undefined ? cmd.y : cmd[2]));
                break;
            case "Q":
                bezierOrder(2);
                bezierVertex((cmd.x1 !== undefined ? cmd.x1 : cmd[1]), (cmd.y1 !== undefined ? cmd.y1 : cmd[2]));
                bezierVertex((cmd.x !== undefined ? cmd.x : cmd[3]), (cmd.y !== undefined ? cmd.y : cmd[4]));
                break;
            case "C":
                bezierOrder(3);
                bezierVertex((cmd.x1 !== undefined ? cmd.x1 : cmd[1]), (cmd.y1 !== undefined ? cmd.y1 : cmd[2]));
                bezierVertex((cmd.x2 !== undefined ? cmd.x2 : cmd[3]), (cmd.y2 !== undefined ? cmd.y2 : cmd[4]));
                bezierVertex((cmd.x !== undefined ? cmd.x : cmd[5]), (cmd.y !== undefined ? cmd.y : cmd[6]));
                break;
            case "Z":
                endContour(CLOSE);
                beginContour();
                break;
        }
    }
    endContour();
    endShape();
}

/**
 * Translates the coordinate system to properly position/center text paths based on their bounds.
 */
function translateToPathBounds(bounds, x, y) {
    let bx = bounds.x || 0, by = bounds.y || 0, bw = bounds.w || 0, bh = bounds.h || 0;
    translate(x - bx, y - (bh / 2 + by));
}

/**
 * 
 */
class AbstractLyricBlock {
    constructor(player, id, startTime, endTime, text, config, callInit = true) {
        this.player = player;
        this.id = id;
        this.startTime = startTime;
        this.endTime = endTime;
        this.text = text;
        this.config = config; // Store config
        this.pathCommands = null;
        this.bounds = { x: 0, y: 0, w: 0, h: 0 };
        this.wasVisible = false;
        this.x = 0;
        this.y = 0;
        this.prev = null;
        this.next = null;

        // Granular paths
        this.wordPathCommands = [];
        this.wordBounds = [];
        this.wordX = []; // Add X positions
        this.wordsTotalWidth = 0;
        this.charPathCommands = [];
        this.charBounds = [];
        this.charX = []; // Add X positions
        this.charsTotalWidth = 0;
        this.currentWordIndex = -1;
        this.currentCharIndex = -1;
        this.words = [];
        this.chars = [];

        this.textObjectClass = AbstractTextObject;

        if (this.useWordPaths) {
            // Split by Space, Newline, Comma, Tab
            // Note: filter(Boolean) removes empty strings result from split
            this.words = this.text.split(/[\s,\t\n]+/).filter(Boolean);
        }
        if (this.useCharPaths) {
            // Split into chars (including spaces? usually for animation we might want non-space chars)
            // But let's stick to simple split('') but maybe ignore newlines for separate paths?
            // User said: "１文字毎に区切った"
            this.chars = this.text.split('');
        }

        if (callInit) {
            this.init();
        }
    }

    setTextObjectClass(cls) {
        this.textObjectClass = cls;
    }

    init() {
        this.progress = 0;
    }

    reset() {
        // Reset all properties to initial state
        this.init();
    }

    get usePaths() { return true; }
    get useWordPaths() { return false; }
    get useCharPaths() { return false; }
    get wordSpacing() { return 0; }
    get charSpacing() { return 0; }

    // Default Y position calculation (can be overridden)
    getY(totalHeight) {
        return totalHeight * (6 / 12);
    }

    getProgress(time) {
        if (this.endTime === this.startTime) return 0;
        return (time - this.startTime) / (this.endTime - this.startTime);
    }

    get warmupTime() { return 200; }

    get textDurationLeadTime() { return 0; }
    get textLifetimeExtend() { return 0; }

    isVisible(time) {
        return time >= this.startTime - this.warmupTime && time < this.endTime;
    }

    resetPaths() {
        this.pathCommands = null;
    }

    preparePaths(currentFont, currentFontSize) {
        if (!this.pathCommands && currentFont) {
            try {
                textSize(currentFontSize);
                this.bounds = currentFont.textBounds(this.text, -width / 2, 0, width);

                if (this.usePaths) {
                    this.pathCommands = currentFont.textToPaths(this.text, -width / 2, 0, width);
                } else {
                    this.pathCommands = [];
                }

                this.prepareGranularPaths(currentFont, currentFontSize);
            } catch (e) {
                console.error("Error generating paths for block:", this.text, e);
                this.pathCommands = [];
            }
        }
    }

    prepareGranularPaths(currentFont, currentFontSize) {
        // Ensure context settings for textWidth
        textFont(currentFont);
        textSize(currentFontSize);

        // Words
        this.wordPathCommands = [];
        this.wordBounds = [];
        this.wordX = [];
        this.wordsTotalWidth = 0;
        if (this.useWordPaths) {
            let currentX = 0;
            const spaceW = textWidth(" "); // Use textWidth for space

            for (let i = 0; i < this.words.length; i++) {
                let word = this.words[i];
                try {
                    // Generate at (0,0)
                    const cmds = currentFont.textToPaths(word, 0, 0, currentFontSize);
                    const bnds = currentFont.textBounds(word, 0, 0, currentFontSize);
                    this.wordPathCommands.push(cmds);
                    this.wordBounds.push(bnds);
                    this.wordX.push(currentX); // Store offset from left (0)

                    // Advance calculation: textWidth(word) + space + custom spacing
                    let w = textWidth(word);
                    let advance = w + spaceW + this.wordSpacing;

                    currentX += advance;
                } catch (e) {
                    console.error("Error generating word path:", word, e);
                    this.wordPathCommands.push([]);
                    this.wordBounds.push({ x: 0, y: 0, w: 0, h: 0 });
                    this.wordX.push(0);
                }
            }
            // Remove the trailing space/gap from total width if exists
            if (this.words.length > 0) {
                const spaceW = textWidth(" ");
                this.wordsTotalWidth = currentX - (spaceW + this.wordSpacing);
            } else {
                this.wordsTotalWidth = 0;
            }
        }

        // Chars
        this.charPathCommands = [];
        this.charBounds = [];
        this.charX = [];
        this.charsTotalWidth = 0;
        if (this.useCharPaths) {
            let currentX = 0;

            for (let i = 0; i < this.chars.length; i++) {
                let char = this.chars[i];
                try {
                    const cmds = currentFont.textToPaths(char, 0, 0, currentFontSize);
                    const bnds = currentFont.textBounds(char, 0, 0, currentFontSize);
                    this.charPathCommands.push(cmds);
                    this.charBounds.push(bnds);
                    this.charX.push(currentX);

                    // Width accumulation: textWidth(char) + custom spacing
                    const w = textWidth(char);
                    currentX += w + this.charSpacing;
                } catch (e) {
                    console.error("Error generating char path:", char, e);
                    this.charPathCommands.push([]);
                    this.charBounds.push({ x: 0, y: 0, w: 0, h: 0 });
                    this.charX.push(0);
                }
            }
            if (this.chars.length > 0) {
                this.charsTotalWidth = currentX - this.charSpacing;
            } else {
                this.charsTotalWidth = 0;
            }
        }
    }

    update(time, currentFont, currentFontSize) {
        this.progress = this.getProgress(time);

        // Calculate indices based on progress (0.0 to 1.0)
        // Only if progress is within reasonable tracking range
        if (this.useWordPaths && this.words.length > 0) {
            const wIndex = Math.floor(this.progress * this.words.length);
            this.currentWordIndex = constrain(wIndex, -1, this.words.length - 1);
        }
        if (this.useCharPaths && this.chars.length > 0) {
            const cIndex = Math.floor(this.progress * this.chars.length);
            this.currentCharIndex = constrain(cIndex, -1, this.chars.length - 1);
        }

        const isNowVisible = this.isVisible(time);

        if (this.wasVisible && !isNowVisible) {
            console.log(`[Text End] Time: ${formatTime(time)} | Hide: "${this.text.replace(/\n/g, ' ')}"`);
            this.wasVisible = false;
        } else if (!this.wasVisible && isNowVisible) {
            console.log(`[Text Start] Time: ${formatTime(time)} | Show: "${this.text.replace(/\n/g, ' ')}"`);
            this.wasVisible = true;
            this.preparePaths(currentFont, currentFontSize);
        } else if (this.wasVisible && isNowVisible) {
            if (!this.pathCommands) {
                this.preparePaths(currentFont, currentFontSize);
            }
        }
    }

    draw() {
        // To be overridden
    }

    createTextObject(pathCommands, bounds, x, y, lifetime, activeDuration, activeTerm, options) {
        return new this.textObjectClass(this.player, pathCommands, bounds, x, y, lifetime + this.textLifetimeExtend, activeDuration + this.textDurationLeadTime, activeTerm, options);
    }
}

/**
 * 
 */
class AbstractLifeObject {
    constructor(player, lifetime, callInit = true) {
        this.player = player;
        this.lifetime = lifetime || 0;

        if (callInit) {
            this.init();
        }
    }

    init() {
        this.spawnTime = millis();
        this.elapsed = 0;
        this.isEnabled = false;
        this.isDead = false;
    }

    die() {
        this.isDead = true;
    }

    get isLive() {
        return !this.isDead;
    }

    update() {
        if (this.isDead) return;

        this.elapsed = millis() - this.spawnTime;

        if (this.elapsed < this.activeDuration) {
            // Pre-active
            this.isEnabled = false;
        } else if (this.elapsed < this.activeDuration + this.activeTerm) {
            // Active period
            this.isEnabled = true;
        } else {
            // Post-active
            this.isEnabled = false;
        }

        // Death check
        if (this.elapsed >= this.lifetime) {
            this.isDead = true;
        }
    }

    draw() {
        if (this.isDead) return;
    }
}

/**
 * 
 */
class AbstractTextObject extends AbstractLifeObject {
    constructor(player, pathCommands, bounds, x, y, lifetime, activeDuration, activeTerm, options, callInit = true) {
        super(player, lifetime || 0, false);

        this.pathCommands = pathCommands;
        this.bounds = bounds;
        this.x = x;
        this.y = y;

        this.activeDuration = activeDuration || 0;
        this.activeTerm = activeTerm || 0;
        this.options = options || {};
        this.styleConfig = this.options.style;

        if (callInit) {
            this.init();
        }
    }

    init() {
        super.init();

        this.fadeInProgress = 0;
        this.fadeOutProgress = 0;

        this.fillColor = this.styleConfig.TEXT_FILL_COLOR;
        this.strokeColor = this.styleConfig.TEXT_STROKE_COLOR;
        this.strokeWeight = this.styleConfig.TEXT_STROKE_WEIGHT;
    }

    update() {
        if (this.isDead) return;

        super.update();

        this.calcFadeInOutZeroToOne();
    }

    calcFadeInOutZeroToOne() {
        if (this.elapsed < this.activeDuration) {
            // Fade In
            if (this.activeDuration > 0) {
                this.fadeInProgress = map(this.elapsed, 0, this.activeDuration, 0, 1);
            } else {
                this.fadeInProgress = 1;
            }
        } else if (this.elapsed < this.activeDuration + this.activeTerm) {
            // Active
            this.fadeInProgress = 1;
            this.fadeOutProgress = 0;
        } else {
            // Fade Out
            const fadeOutStart = this.activeDuration + this.activeTerm;
            const fadeOutDuration = this.lifetime - fadeOutStart;
            if (fadeOutDuration > 0) {
                const fadeOutElapsed = this.elapsed - fadeOutStart;
                this.fadeOutProgress = fadeOutElapsed / fadeOutDuration
                // this.fadeOutZeroToOne =  map(fadeOutElapsed, 0, fadeOutDuration, 1, 0);
            } else {
                this.fadeOutProgress = 1;
            }
        }
    }

    applyStyle() {
        this.applyTextStyle_Default();
    }

    setTextAlpha(alpha) {
        // Apply style with alpha
        if (this.strokeColor !== null && this.strokeWeight !== null) {
            let strokeCol = color(this.strokeColor);
            strokeCol.setAlpha(alpha);
            stroke(strokeCol);
            strokeWeight(this.strokeWeight);
        } else {
            noStroke();
        }

        if (this.fillColor !== null) {
            let fillCol = color(this.fillColor);
            fillCol.setAlpha(alpha);
            fill(fillCol);
        } else {
            noFill();
        }
    }

    applyTextStyle_Default() {
        // Calculate alpha based on status
        const alpha = this.isEnabled
            ? (this.styleConfig.TEXT_ALPHA_ENABLED ?? 255)
            : (this.styleConfig.TEXT_ALPHA_DISABLED ?? 100);

        this.setTextAlpha(alpha);
    }

    applyTextStyle_OnOnly() {
        // Calculate alpha based on status
        const alpha = this.styleConfig.TEXT_ALPHA_ENABLED ?? 255
        this.setTextAlpha(alpha);
    }

    applyTextStyle_FadeInOut() {
        const maxAlpha = this.styleConfig.TEXT_ALPHA_ENABLED ?? 255;
        let alpha = 0;

        if (this.fadeInProgress > 0) {
            alpha = this.fadeInProgress * maxAlpha;
        }
        if (this.fadeOutProgress > 0) {
            alpha = (1 - this.fadeOutProgress) * maxAlpha;
        }
        this.setTextAlpha(constrain(alpha, 0, 255));
    }

    draw() {
        if (this.isDead || !this.pathCommands || this.pathCommands.length === 0) return;

        push();
        translateToPathBounds(this.bounds, this.x, this.y);

        // Apply pre-active offset if not enabled and offset exists
        if (!this.isEnabled && this.options.preActiveOffset) {
            translate(this.options.preActiveOffset.x || 0, this.options.preActiveOffset.y || 0);
        }

        this.applyStyle()

        executePathCommands(this.pathCommands);
        pop();
    }
}

/**
 * 
 */
class AwesomeLyricPlayer {
    constructor(config, LyricBlockClass, TextObjectClass) {
        this.objs = [];
        this.config = config;
        this.canvasConfig = config.CANVAS;
        this.styleConfig = config.STYLE;
        this.songConfig = config.SONG;

        this.LyricBlockClass = LyricBlockClass;
        this.TextObjectClass = TextObjectClass;

        this.wavesurfer = null;
        this.font = null;
        this.isLoading = true;
        this.isStarted = false;
        this.isPlaying = false;
        this.lyrics = [];
        this.fontSize = 48;
        this.isTransparent = localStorage.getItem('lyric-player-transparent') === 'true';
        this.errorMessage = null;
    }

    async loadResources() {
        this.isLoading = true;
        try {
            // Load Font
            console.log("Loading font...");
            this.font = await loadFont(this.styleConfig.FONT_FILENAME);
        } catch (err) {
            console.error("Error loading resources:", err);
            this.errorMessage = `Failed to load font: ${this.styleConfig.FONT_FILENAME}`;
            // this.isLoading = false;
        }

        try {
            // Load Lyrics
            console.log("Loading Lyrics SRT...");
            const response = await fetch(this.songConfig.LYRIC_FILENAME);
            const srtText = await response.text();
            this.lyrics = this.parseSRT(srtText);
            console.log("Lyrics loaded:", this.lyrics.length);

            // Load Audio
            console.log("Loading song with WaveSurfer...");
            this.wavesurfer = WaveSurfer.create({
                container: '#waveform-container',
                url: this.songConfig.AUDIO_FILENAME,
                backend: 'WebAudio',
                interactive: true,
                waveColor: '#4f46e5',
                progressColor: '#818cf8',
                height: 80
            });

            this.wavesurfer.on('ready', () => {
                this.isLoading = false;
            });

        } catch (err) {
            console.error("Error loading resources:", err);
            this.isLoading = false;
        }
    }

    setup() {
        let cnv;
        if (this.canvasConfig.FIXED) {
            cnv = createCanvas(this.canvasConfig.WIDTH, this.canvasConfig.HEIGHT);
        } else {
            cnv = createCanvas(windowWidth, windowHeight);
        }
        cnv.parent('canvas-container');
        this.updateFontSize();
        textAlign(CENTER, CENTER);
    }

    updateFontSize() {
        this.fontSize = width / this.styleConfig.FONT_SIZE_RATIO;
        this.fontSize = constrain(this.fontSize, this.styleConfig.FONT_SIZE_MIN, this.styleConfig.FONT_SIZE_MAX);
    }

    draw() {
        this.drawBackground();
        this.drawLyrics();
    }

    drawBackground() {
        if (this.isTransparent || this.styleConfig.BACKGROUND_COLOR === null || this.styleConfig.BACKGROUND_COLOR === 'transparent') {
            clear();
        } else {
            background(this.styleConfig.BACKGROUND_COLOR);
        }
    }

    drawLyrics() {
        if (this.errorMessage) {
            document.getElementById('debug-info').innerText = `Error: ${this.errorMessage}`;
            push();
            fill(255, 0, 0);
            textSize(32);
            textAlign(CENTER, CENTER);
            text(this.errorMessage, width / 2, height / 2);
            pop();
            return;
        }

        if (this.isLoading) {
            document.getElementById('debug-info').innerText = "Loading...";
            return;
        }

        if (!this.isStarted) {
            document.getElementById('debug-info').innerText = "Press S to Start | R: Reset | B: Toggle Background (Color or Transparent) | M: Mute/Unmute";
            return;
        }

        let t = 0;
        if (this.wavesurfer) {
            t = this.wavesurfer.getCurrentTime() * 1000;

            // Check for play state change (e.g. auto stop at end)
            const currentlyPlaying = this.wavesurfer.isPlaying();
            if (this.isPlaying && !currentlyPlaying) {
                cursor();
            } else if (!this.isPlaying && currentlyPlaying) {
                noCursor();
            }
            this.isPlaying = currentlyPlaying;
        }

        let currentDebugId = "-";
        for (let lyric of this.lyrics) {
            lyric.update(t, this.font, this.fontSize);
            lyric.draw();
            if (lyric.wasVisible) {
                currentDebugId = "#" + lyric.id;
            }
        }

        const status = this.isPlaying ? "Playing" : "Paused";
        const muteStatus = (this.wavesurfer && this.wavesurfer.getMuted()) ? " (Muted)" : "";
        const timeStr = formatTime(t);
        document.getElementById('debug-info').innerText = `Time: ${timeStr} | Block: ${currentDebugId} | Status: ${status}${muteStatus}`;
    }

    startMovie() {
        if (this.wavesurfer) {
            this.wavesurfer.play();
            this.isStarted = true;
            this.isPlaying = true;
            noCursor();
        }
    }

    togglePlay() {
        if (this.wavesurfer) {
            this.wavesurfer.playPause();
            this.isPlaying = this.wavesurfer.isPlaying();
            if (this.isPlaying) {
                noCursor();
            } else {
                cursor();
            }
        }
    }

    resetPlayback() {
        if (this.wavesurfer) {
            this.wavesurfer.setTime(0);
        }
        for (let lyric of this.lyrics) {
            lyric.reset();
        }
    }

    toggleBackground() {
        this.isTransparent = !this.isTransparent;
        localStorage.setItem('lyric-player-transparent', this.isTransparent);
    }

    toggleMute() {
        if (this.wavesurfer) {
            this.wavesurfer.setMuted(!this.wavesurfer.getMuted());
        }
    }

    handleKeyPressed() {
        if (key === 's' || key === 'S') {
            if (this.isLoading) {
                return;
            }

            if (!this.isStarted) {
                this.startMovie();
            } else {
                this.togglePlay();
            }
        } else if (key === 'r' || key === 'R') {
            this.resetPlayback();
            return 'RESET';
        } else if (key === 'b' || key === 'B') {
            this.toggleBackground();
        } else if (key === 'm' || key === 'M') {
            this.toggleMute();
        } else if (key === ' ') {
            // Prevent space from scrolling the page
            return false;
        }
    }

    handleWindowResized() {
        if (this.canvasConfig.FIXED) {
            // Do nothing or center canvas if fixed? 
            // Usually FIXED means we don't resize the canvas size, but let's follow existing logic.
        } else {
            resizeCanvas(windowWidth, windowHeight);
        }
        this.updateFontSize();
        this.lyrics.forEach(block => block.resetPaths());
    }

    parseSRT(data) {
        const blocks = data.trim().replace(/\r\n/g, '\n').split(/\n\n+/);
        const result = [];
        blocks.forEach(block => {
            const lines = block.split('\n');
            if (lines.length >= 3) {
                const id = lines[0].trim();
                const times = lines[1].split(' --> ');
                if (times.length === 2) {
                    const startTime = this.parseTime(times[0]);
                    const endTime = this.parseTime(times[1]);
                    const text = lines.slice(2).join('\n');
                    if (text) {
                        const block = new this.LyricBlockClass(this, id, startTime, endTime, text, this.config); // Pass this.config
                        block.setTextObjectClass(this.TextObjectClass);
                        result.push(block);
                    }
                }
            }
        });
        const sortedBlocks = result.sort((a, b) => a.startTime - b.startTime);

        // Link blocks
        for (let i = 0; i < sortedBlocks.length; i++) {
            if (i > 0) {
                sortedBlocks[i].prev = sortedBlocks[i - 1];
            }
            if (i < sortedBlocks.length - 1) {
                sortedBlocks[i].next = sortedBlocks[i + 1];
            }
        }

        return sortedBlocks;
    }

    parseTime(timeStr) {
        let tStr = timeStr.trim().replace(',', '.');
        const parts = tStr.split(':');
        let h = 0, m = 0, s = 0, ms = 0;
        if (parts.length === 3) {
            h = parseInt(parts[0]);
            m = parseInt(parts[1]);
            const sParts = parts[2].split('.');
            s = parseInt(sParts[0]);
            ms = parseInt(sParts[1] || 0);
        }
        return (h * 3600000) + (m * 60000) + (s * 1000) + ms;
    }
}
