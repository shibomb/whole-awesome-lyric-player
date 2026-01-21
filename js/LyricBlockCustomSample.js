/*!
 * awesome-lyric-player
 * Copyright (c) 2026 WHOLE LLC.
 * Licensed under the PolyForm Noncommercial License 1.0.0
 */

class LyricBlock_CurrentChars_LongLifetimeText extends LyricBlock_CurrentChars {
    get textDurationLeadTime() { return 500; }
    get textLifetimeExtend() { return 1500; }
}

class TwinkleStar extends AbstractLifeObject {
    constructor(player, x, y, lifetime, fillColor, strokeColor) {
        super(player, lifetime);

        this.x = x;
        this.y = y;

        this.vx = random(2, 10);      // 右方向
        this.vy = random(-30, -15);   // 上方向
        this.gravity = 0.98;
        this.rotationSpeed = random(0.1, 0.4);
        this.currentRotation = 0;

        this.fillColor = fillColor;
        this.strokeColor = strokeColor;
        this.init();
    }

    update() {
        if (this.isDead) return;
        super.update();

        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.currentRotation += this.rotationSpeed;

        if (this.x > width || this.x < 0 || this.y > height) {
            this.die();
        }
    }

    draw() {
        if (this.isDead) return;
        super.draw();

        push();

        translate(this.x, this.y);
        rotate(this.currentRotation);

        textSize(60);
        textAlign(CENTER, CENTER);

        fill(this.fillColor);
        stroke(this.strokeColor);
        strokeWeight(8);

        text("★", 0, 0);

        pop();
    }
}

class TextObject_CityPopRandomColor_Star extends TextObject_CityPopRandomColor {

    update() {
        super.update();

        // start spawn stars
        if (!this.starSpawned && this.fadeOutProgress > 0) {
            const spawnCount = floor(random(3, 10));
            const spawnX = this.x + (this.bounds.w || 0);
            const spawnY = this.y;

            for (let i = 0; i < spawnCount; i++) {
                const lifetime = 2000;
                const sx = spawnX + random(-20, 20);
                const sy = spawnY + random(-20, 20);
                this.player.objs.push(new TwinkleStar(this.player, sx, sy, lifetime, this.fillColor, this.strokeColor));
            }

            // spawn only once
            this.starSpawned = true;
        }
    }
}
