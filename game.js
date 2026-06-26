const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 800, H = 400;
canvas.width = W;
canvas.height = H;

// ========================================================
// 🖼️ МЕСТО ДЛЯ ВАШИХ ССЫЛОК НА КАРТИНКИ
// ========================================================

const IMG_PLAYER = "https://i.postimg.cc/hG9tfP2c/Vstal-napravo.png";
const IMG_ENEMY = "https://i.postimg.cc/ht0tTp23/krabik-(1).png";
const IMG_COIN = "https://i.postimg.cc/2yc8g6Zv/PECINKAAA-removebg-preview.png";
const IMG_BG = "https://i.postimg.cc/zDTqZxT6/art-bot-1773854278007.jpg";

// ========================================================
// 🔊 МЕСТО ДЛЯ ВАШИХ ССЫЛОК НА АУДИО
// ========================================================

const SND_BG = " ";      // 👈 ВСТАВЬ СЮДА ССЫЛКУ НА КАКОЙ-ТО ЗВУК (ФОН)
const SND_JUMP = "https://www.image2url.com/r2/default/audio/1776433477915-1e81797b-5153-450e-8b75-025f6523d3b7.mp3";    // 👈 ВСТАВЬ СЮДА ССЫЛКУ НА КАКОЙ-ТО ЗВУК (ПРЫЖОК)
const SND_HIT = "https://www.image2url.com/r2/default/audio/1776433444499-ee5a9a7b-c53d-4686-8b69-b6e910f0696e.mp3 ";     // 👈 ВСТАВЬ СЮДА ССЫЛКУ НА КАКОЙ-ТО ЗВУК (УДАР ПО ГЕРОЮ)
const SND_COIN = " https://www.image2url.com/r2/default/audio/1776433390182-6a0c5552-3d8f-43db-b32c-98069836159f.mp3";    // 👈 ВСТАВЬ СЮДА ССЫЛКУ НА КАКОЙ-ТО ЗВУК (МОНЕТКА)
const SND_WIN = " https://www.image2url.com/r2/default/audio/1776433499624-0b60aa2e-6b5c-460a-b0d2-e7f9db624d05.mp3 ";     // 👈 ВСТАВЬ СЮДА ССЫЛКУ НА КАКОЙ-ТО ЗВУК (ПОБЕДА)
const SND_GAMEOVER = "https://www.image2url.com/r2/default/audio/1776433521644-637daef3-c526-4444-b62a-fb6f9603b2d2.mp3 ";
const bgMusic = new Audio(SND_BG);
bgMusic.loop = true;
bgMusic.volume = 0.3;

const jumpSound = new Audio(SND_JUMP);
const hitSound = new Audio(SND_HIT);
const coinSound = new Audio(SND_COIN);
const winSound = new Audio(SND_WIN);
const gameOverSound = new Audio(SND_GAMEOVER);

let musicStarted = false; 

// ========================================================

const playerImg = new Image(); playerImg.src = IMG_PLAYER;
const enemyImg = new Image(); enemyImg.src = IMG_ENEMY;
const coinImg = new Image(); coinImg.src = IMG_COIN;
const bgImg = new Image(); bgImg.src = IMG_BG;

const GRAVITY = 0.4;
const JUMP_POWER = -7.5;
const MOVE_SPEED = 3.2;
const CLIMB_SPEED = 2.5;
const P_W = 26, P_H = 26;

let gameActive = true;
let treasuresCollected = 0;
const TREASURE_TOTAL = 3;

let lives = 5;
let isInvulnerable = false;
let invulnerabilityTimer = 0;

let gravityDir = 1;
let platforms = [];
let enemies = [];
let player = {};

const keys = { left: false, right: false, up: false };

function initGame() {
    platforms = [
        { x: 0, y: H - 30, w: W, h: 30 },
        { x: 60, y: 330, w: 80, h: 20 },
        { x: 610, y: 150, w: 25, h: 1000},
        { x: 410, y: 150, w: 100, h: 20 },
        { x: 210, y: 230, w: 70, h: 20 },
        { x: 510, y: 350, w: 70, h: 20 }
    ];

    treasures = [
        { x: 60, y: 300, w: 30, h: 30, collected: false },
        { x: 435, y: 120, w: 30, h: 30, collected: false },
        { x: 530, y: 320, w: 30, h: 30, collected: false }
    ];

    enemies = [
        { x: 520, y:326, w: 40, h: 35, vx: 1.2, startX: 510, endX: 570 }
    ];

    player = {
        x: 100, y: 300, vx: 0, vy: 0,
        onGround: false, facingRight: true, climbing: false
    };

    lives = 5;
    treasuresCollected = 0;
    isInvulnerable = false;
    updateUI();
    gameActive = true;
}

function updateUI() {
    const uiElement = document.getElementById('treasureCount');
    if(uiElement) uiElement.innerText = `${treasuresCollected}/${TREASURE_TOTAL}`;
}

function collide(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + P_W > r2.x &&
           r1.y < r2.y + r2.h && r1.y + P_H > r2.y;
}

function updateMovement() {
    if (player.climbing) {
        player.vx = 0; player.vy = 0;
        if (keys.up) player.y -= CLIMB_SPEED;
        else if (!keys.up) player.climbing = false;
        
        let touchWall = platforms.some(p => p.w < 30 && collide(player, p));
        if (!touchWall) player.climbing = false;
    } else {
        if (keys.left) { player.vx = -MOVE_SPEED; player.facingRight = false; }
        else if (keys.right) { player.vx = MOVE_SPEED; player.facingRight = true; }
        else { player.vx *= 0.8; }
        player.vy += GRAVITY * gravityDir;
    }

    let newX = player.x + player.vx;
    for (let p of platforms) {
        if (collide({x: newX, y: player.y}, p)) {
            if (p.w < 30 && keys.up) player.climbing = true;
            newX = player.vx > 0 ? p.x - P_W : p.x + p.w;
            player.vx = 0;
        }
    }
    player.x = newX;

    player.onGround = false;
    let newY = player.y + player.vy;
    for (let p of platforms) {
        if (collide({x: player.x, y: newY}, p)) {
            if (player.vy * gravityDir > 0) {
                player.onGround = true;
                newY = gravityDir === 1 ? p.y - P_H : p.y + p.h;
            } else {
                newY = gravityDir === 1 ? p.y + p.h : p.y - P_H;
            }
            player.vy = 0;
        }
    }
    player.y = newY;

    if (keys.up && player.onGround) {
        player.vy = JUMP_POWER * gravityDir;
        if(SND_JUMP) { jumpSound.currentTime = 0; jumpSound.play(); }
    }
 
}

function updateEnemies() {
    if (isInvulnerable) {
        invulnerabilityTimer--;
        if (invulnerabilityTimer <= 0) isInvulnerable = false;
    }

    for (let e of enemies) {
        e.x += e.vx;
        if (e.x > e.endX || e.x < e.startX) e.vx *= -1;

        if (!isInvulnerable && collide(player, e)) {
            lives--;
            isInvulnerable = true;
            invulnerabilityTimer = 120;
            
            if (lives <= 0) {
                gameActive = false;
                if(SND_GAMEOVER) gameOverSound.play();
                setTimeout(() => { 
                    alert("💀 Игра окончена! Попробуйте снова."); 
                    initGame(); 
                }, 100);
            } else {
                if(SND_HIT) { hitSound.currentTime = 0; hitSound.play(); }
            }
        }
    }
}

function collectTreasures() {
    treasures.forEach(t => {
        if (!t.collected && collide(player, t)) {
            t.collected = true;
            treasuresCollected++;
            
            if(SND_COIN) { coinSound.currentTime = 0; coinSound.play(); }
            
            updateUI();
            
            if (treasuresCollected === TREASURE_TOTAL) {
                gameActive = false;
                if(SND_WIN) winSound.play();
                setTimeout(() => { 
                    alert("🏆 Победа!"); 
                    initGame(); 
                }, 100);
            }
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, W, H);
    
    if (bgImg.src !== "" && bgImg.complete) {
        ctx.drawImage(bgImg, 0, 0, W, H);
    } else {
        ctx.fillStyle = "#7ec8e0";
        ctx.fillRect(0, 0, W, H);
    }

    ctx.fillStyle = "#8B5A2B";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    treasures.forEach(t => {
        if (!t.collected) {
            if (coinImg.src !== "" && coinImg.complete) {
                ctx.drawImage(coinImg, t.x, t.y, t.w, t.h);
            } else {
                ctx.fillStyle = "gold";
                ctx.beginPath(); ctx.arc(t.x+7, t.y+7, 7, 0, Math.PI*2); ctx.fill();
            }
        }
    });

    enemies.forEach(e => {
        if (enemyImg.src !== "" && enemyImg.complete) {
            ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
        } else {
            ctx.fillStyle = "red";
            ctx.fillRect(e.x, e.y, e.w, e.h);
        }
    });

    ctx.save();
    if (isInvulnerable) ctx.globalAlpha = 0.5; 
    
    if (playerImg.src !== "" && playerImg.complete) {
        if (!player.facingRight) {
            ctx.translate(player.x + P_W, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(playerImg, 0, 0, P_W, P_H);
        } else {
            ctx.drawImage(playerImg, player.x, player.y, P_W, P_H);
        }
    } else {
        ctx.fillStyle = player.climbing ? "orange" : "green";
        ctx.fillRect(player.x, player.y, P_W, P_H);
    }
    ctx.restore();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("HP: " + "❤️".repeat(lives), 15, H - 45);
}

function gameLoop() {
    if (gameActive) {
        updateMovement();
        updateEnemies();
        collectTreasures();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', e => {
    if (!musicStarted && SND_BG) {
        bgMusic.play();
        musicStarted = true;
    }

    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') { keys.up = true; e.preventDefault(); }
});

window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') keys.up = false;
});

initGame();
gameLoop();

