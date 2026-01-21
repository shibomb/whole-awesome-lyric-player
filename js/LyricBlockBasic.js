/*!
 * awesome-lyric-player
 * Copyright (c) 2026 WHOLE LLC.
 * Licensed under the PolyForm Noncommercial License 1.0.0
 */

class LyricBlock_1Row extends AbstractLyricBlock {
    init() {
        super.init();
        this.processedList = new Set();
    }

    reset() {
        super.reset();
        this.processedList.clear();
    }

    draw() {
        if (!this.wasVisible) return;

        if (!this.processedList.has(0)) {
            const startX = width / 2 - this.bounds.w / 2;
            const x = startX;
            const y = this.getY(height);

            const blockDuration = (this.endTime - this.startTime) + this.warmupTime;

            const lifetime = blockDuration;
            const activeDuration = 0; // Highlight starts at startTime
            const activeTerm = blockDuration;

            const ft = this.createTextObject(
                this.pathCommands,
                this.bounds,
                x,
                y,
                lifetime,
                activeDuration,
                activeTerm,
                { style: this.config.STYLE }
            );
            this.player.objs.push(ft);
            this.processedList.add(0);
        }
    }
}

class LyricBlock_2Rows extends LyricBlock_1Row {
    getY(totalHeight) {
        return totalHeight * (9 / 12);
    }

    isVisible(time) {
        // Visible if previous block (next line position) is visible OR current block is visible
        if (this.prev) {
            const prevEndTime = this.prev.endTime;
            // If we are in the previous block's time window, we should be visible
            if (time >= this.prev.startTime && time < prevEndTime) {
                return true;
            }
        } else {
            // First line: show early (up to 2000ms before, but not negative)
            const leadTime = Math.max(0, this.startTime - 2000);
            if (time >= leadTime && time < this.endTime) {
                return true;
            }
        }
        return super.isVisible(time);
    }

    draw() {
        if (!this.wasVisible) return;

        if (!this.processedList.has(0)) {
            const startX = width / 2 - this.bounds.w / 2;
            const x = startX;
            // Target Y (Row 1)
            const y = this.getY(height);

            // Calculate Timings
            let prevStartTime = Math.max(0, this.startTime - 2000); // Default lead time, clamped to 0
            if (this.prev) {
                prevStartTime = this.prev.startTime;
            }

            const lifetime = this.endTime - prevStartTime;

            // Shift active phase earlier by leadTime
            let activeDuration = (this.startTime - prevStartTime);
            let activeTerm = (this.endTime - this.startTime) + this.warmupTime;

            // Handle overlap or short gaps where leadTime is too large
            if (activeDuration < 0) {
                activeDuration = 0;
            }

            // Offset to Row 2
            const rowHeight = this.bounds.h * 1.5;
            const preActiveOffset = { x: 0, y: rowHeight };

            const ft = this.createTextObject(
                this.pathCommands,
                this.bounds,
                x,
                y,
                lifetime,
                activeDuration,
                activeTerm,
                {
                    style: this.config.STYLE,
                    preActiveOffset: preActiveOffset
                }
            );
            this.player.objs.push(ft);
            this.processedList.add(0);
        }
    }
}

class LyricBlock_Words extends AbstractLyricBlock {
    get usePaths() { return false; }
    get useWordPaths() { return true; }
    get wordSpacing() { return 32; }

    init() {
        super.init();
        this.processedWords = new Set();
    }

    reset() {
        super.reset();
        this.processedWords.clear();
    }

    draw() {
        if (!this.wasVisible) return;

        if (this.processedWords.size === 0) {
            const blockDuration = (this.endTime - this.startTime) + this.warmupTime;
            const startX = width / 2 - this.wordsTotalWidth / 2;
            const y = this.getY(height);

            for (let i = 0; i < this.words.length; i++) {
                if (this.wordPathCommands[i] && this.wordX[i] !== undefined) {
                    const x = startX + this.wordX[i];

                    const wordDuration = blockDuration / this.words.length;
                    const lifetime = blockDuration;
                    const activeDuration = (i * wordDuration);
                    const activeTerm = wordDuration;

                    const ft = this.createTextObject(
                        this.wordPathCommands[i],
                        this.wordBounds[i],
                        x,
                        y,
                        lifetime,
                        activeDuration,
                        activeTerm,
                        { style: this.config.STYLE }
                    );
                    this.player.objs.push(ft);
                    this.processedWords.add(i);
                }
            }
        }
    }
}

class LyricBlock_Chars extends AbstractLyricBlock {
    get usePaths() { return false; }
    get useCharPaths() { return true; }
    get charSpacing() { return 24; }

    init() {
        super.init();
        this.processedChars = new Set();
    }

    reset() {
        super.reset();
        this.processedChars.clear();
    }

    draw() {
        if (!this.wasVisible) return;

        if (this.processedChars.size === 0) {
            const blockDuration = (this.endTime - this.startTime) + this.warmupTime;
            const startX = width / 2 - this.charsTotalWidth / 2;
            const y = this.getY(height);

            for (let i = 0; i < this.chars.length; i++) {
                if (this.charPathCommands[i] && this.charX[i] !== undefined) {
                    const x = startX + this.charX[i];

                    const charDuration = blockDuration / this.chars.length;
                    const lifetime = blockDuration;
                    const activeDuration = (i * charDuration);
                    const activeTerm = charDuration;

                    const ft = this.createTextObject(
                        this.charPathCommands[i],
                        this.charBounds[i],
                        x,
                        y,
                        lifetime,
                        activeDuration,
                        activeTerm,
                        { style: this.config.STYLE }
                    );
                    this.player.objs.push(ft);
                    this.processedChars.add(i);
                }
            }
        }
    }
}


class LyricBlock_CurrentWords extends LyricBlock_Words {
    get textDurationLeadTime() { return 100; }
    get textLifetimeExtend() { return 400; }

    draw() {
        if (!this.wasVisible) return;

        if (this.currentWordIndex >= 0 && !this.processedWords.has(this.currentWordIndex)) {
            const i = this.currentWordIndex;
            if (this.wordPathCommands[i] && this.wordX[i] !== undefined) {
                const blockDuration = (this.endTime - this.startTime) + this.warmupTime;
                const startX = width / 2 - this.wordsTotalWidth / 2;
                const y = this.getY(height);

                // JIT Spawning: Spawn immediately when word is reached
                const x = startX + this.wordX[i];
                const wordDuration = blockDuration / this.words.length;

                // No delay (activeDuration = 0) because we spawn exactly on time
                const activeDuration = 0;
                const activeTerm = wordDuration;
                const lifetime = activeTerm; // Keep alive a bit longer for fade out if needed

                const ft = this.createTextObject(
                    this.wordPathCommands[i],
                    this.wordBounds[i],
                    x,
                    y,
                    lifetime,
                    activeDuration,
                    activeTerm,
                    { style: this.config.STYLE }
                );
                this.player.objs.push(ft);
                this.processedWords.add(i);
            }
        }
    }
}

class LyricBlock_CurrentChars extends LyricBlock_Chars {
    get textDurationLeadTime() { return 200; }
    get textLifetimeExtend() { return 1200; }

    draw() {
        if (!this.wasVisible) return;

        if (this.currentCharIndex >= 0 && !this.processedChars.has(this.currentCharIndex)) {
            const i = this.currentCharIndex;
            if (this.charPathCommands[i] && this.charX[i] !== undefined) {
                const blockDuration = (this.endTime - this.startTime) + this.warmupTime;
                const startX = width / 2 - this.charsTotalWidth / 2;
                const y = this.getY(height);

                const x = startX + this.charX[i];
                const charDuration = blockDuration / this.chars.length;

                const activeDuration = 0;
                const activeTerm = charDuration;
                const lifetime = activeTerm;

                const ft = this.createTextObject(
                    this.charPathCommands[i],
                    this.charBounds[i],
                    x,
                    y,
                    lifetime,
                    activeDuration,
                    activeTerm,
                    { style: this.config.STYLE }
                );
                this.player.objs.push(ft);
                this.processedChars.add(i);
            }
        }
    }
}

class TextObject_Simple extends AbstractTextObject {
}

class TextObject_Jitter extends AbstractTextObject {
    init() {
        super.init();
        this.max = 10;
    }

    update() {
        super.update();

        this.x += random(-this.max, this.max);
        this.y += random(-this.max, this.max);
    }

    applyStyle() {
        // this.applyTextStyle_Default();
        // this.applyTextStyle_OnOnly();
        this.applyTextStyle_FadeInOut();

        // random value 0-1
        const rand = noise(this.x / 100, this.y / 100, this.elapsed / 1000)

        // rotate
        rotate(radians(
            map(rand, 0, 1, -this.max, this.max)
        ));

        // zoom
        scale(map(rand, 0, 1, 1, 5));

        // if active ended, scale up more
        if (this.fadeOutProgress > 0) {
            const val = map(this.easeInExpo(this.fadeOutProgress), 0, 1, 1, 3);
            scale(val);
        }
    }

    // easing function
    // see https://easings.net/
    easeInExpo(x) {
        return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
    }
}

class TextObject_CityPopRandomColor extends AbstractTextObject {

    init() {
        super.init();

        this.colors = [
            { "fill": "#ffffff", "stroke": "#ff00ff", "label": "Neon Pink Edge" },
            { "fill": "#00ffff", "stroke": "#0000ff", "label": "Electric Blue" },
            { "fill": "#ffff00", "stroke": "#ff0055", "label": "Night Sign" },
            { "fill": "#ffcc00", "stroke": "#ff6600", "label": "Golden Hour" },
            { "fill": "#ff99cc", "stroke": "#660066", "label": "Purple Haze" },
            { "fill": "#ffffff", "stroke": "#fb8500", "label": "Sunset Outline" },
            { "fill": "#ffffff", "stroke": "#00b4d8", "label": "Crystal Water" },
            { "fill": "#90e0ef", "stroke": "#0077b6", "label": "Summer Sky" },
            { "fill": "#ffea00", "stroke": "#0096c7", "label": "Beach Parasol" },
            { "fill": "#fec5bb", "stroke": "#84a59d", "label": "Dreamy Mint" },
            { "fill": "#bde0fe", "stroke": "#ffafcc", "label": "Candy Pop" },
            { "fill": "#ffffff", "stroke": "#a2d2ff", "label": "Soft Breeze" }
        ]

        const color = random(this.colors);
        this.fillColor = color.fill;
        this.strokeColor = color.stroke;
        this.strokeWeight = 3;
    }

    update() {
        super.update();

        if (this.fadeInProgress < 1) {
            this.x -= 1;
        }
        if (this.fadeOutProgress > 0) {
            this.y -= this.easeInBack(this.fadeOutProgress) * (height / 50);
        }
    }

    applyStyle() {
        shearY(-0.2);
        scale(2);
        this.applyTextStyle_FadeInOut();
    }

    easeInBack(x) {
        const c1 = 1.70158;
        const c3 = c1 + 1;

        return c3 * x * x * x - c1 * x * x;
    }
}
