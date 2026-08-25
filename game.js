// Duburi Navid - Underwater Diving Game
// Main Game File

class AudioManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.log('Audio not available');
            this.enabled = false;
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playClick() {
        this.playTone(800, 0.1, 'sine', 0.2);
    }

    playCoin() {
        this.playTone(1200, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(1600, 0.15, 'sine', 0.2), 50);
    }

    playTreasure() {
        this.playTone(800, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(1000, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(1400, 0.2, 'sine', 0.3), 200);
    }

    playDamage() {
        this.playTone(200, 0.3, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.3), 100);
    }

    playExplosion() {
        this.playTone(100, 0.5, 'square', 0.4);
        setTimeout(() => this.playTone(80, 0.5, 'square', 0.3), 100);
    }

    playOxygenWarning() {
        this.playTone(600, 0.2, 'sine', 0.2);
    }

    playLevelUp() {
        [500, 600, 700, 800, 1000].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.3), i * 100);
        });
    }

    playGameOver() {
        [400, 350, 300, 250, 200].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.3), i * 150);
        });
    }
}

class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.joystickActive = false;
        this.joystickData = { x: 0, y: 0 };
        
        this.setupKeyboard();
        this.setupJoystick();
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Escape' && this.game.state === 'playing') {
                this.game.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    setupJoystick() {
        const container = document.getElementById('joystick-container');
        const stick = document.getElementById('joystick-stick');
        const base = document.getElementById('joystick-base');
        
        let isDragging = false;
        const maxDistance = 35;

        const handleStart = (e) => {
            isDragging = true;
            this.joystickActive = true;
            e.preventDefault();
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            
            const rect = base.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            let dx = clientX - centerX;
            let dy = clientY - centerY;
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > maxDistance) {
                const ratio = maxDistance / distance;
                dx *= ratio;
                dy *= ratio;
            }
            
            stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            
            this.joystickData.x = dx / maxDistance;
            this.joystickData.y = dy / maxDistance;
            
            e.preventDefault();
        };

        const handleEnd = () => {
            isDragging = false;
            this.joystickActive = false;
            this.joystickData = { x: 0, y: 0 };
            stick.style.transform = 'translate(-50%, -50%)';
        };

        container.addEventListener('mousedown', handleStart);
        container.addEventListener('touchstart', handleStart);
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
        
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
    }

    getInput() {
        const input = { up: false, down: false, left: false, right: false };
        
        // Keyboard
        if (this.keys['KeyW'] || this.keys['ArrowUp']) input.up = true;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) input.down = true;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) input.left = true;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) input.right = true;
        
        // Joystick
        if (this.joystickActive) {
            if (this.joystickData.y < -0.3) input.up = true;
            if (this.joystickData.y > 0.3) input.down = true;
            if (this.joystickData.x < -0.3) input.left = true;
            if (this.joystickData.x > 0.3) input.right = true;
        }
        
        return input;
    }
}

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.reset();
    }

    reset() {
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -Math.random() * 2 - 0.5;
        this.size = Math.random() * 4 + 2;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.life = 1;
        this.decay = Math.random() * 0.005 + 0.002;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        if (this.life <= 0) {
            this.reset();
            this.y = window.innerHeight + 10;
            this.life = 1;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha * this.life;
        
        if (this.type === 'bubble') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (this.type === 'particle') {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Bubble extends Particle {
    constructor(x, y) {
        super(x, y, 'bubble');
    }
}

class FloatingText {
    constructor(x, y, text, color = '#ffd700') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1;
        this.vy = -2;
    }

    update() {
        this.y += this.vy;
        this.life -= 0.02;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 20px Arial';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 30;
        this.height = 30;
        this.collected = false;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.05;
        
        switch(type) {
            case 'coin':
                this.points = 10;
                this.color = '#ffd700';
                this.emoji = '🪙';
                break;
            case 'treasure':
                this.points = 100;
                this.color = '#ff6b6b';
                this.emoji = '💎';
                this.width = 40;
                this.height = 40;
                break;
            case 'artifact':
                this.points = 250;
                this.color = '#a855f7';
                this.emoji = '🏺';
                this.width = 40;
                this.height = 40;
                break;
            case 'bonus':
                this.points = 500;
                this.color = '#fbbf24';
                this.emoji = '👑';
                this.width = 45;
                this.height = 45;
                break;
            case 'oxygen':
                this.points = 0;
                this.color = '#44aaff';
                this.emoji = '💨';
                this.width = 35;
                this.height = 35;
                break;
        }
    }

    update(time) {
        this.floatY = Math.sin(time * this.floatSpeed + this.floatOffset) * 5;
    }

    draw(ctx, cameraY) {
        if (this.collected) return;
        
        const screenY = this.y - cameraY + this.floatY;
        
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.font = `${this.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, screenY);
        ctx.restore();
    }

    checkCollision(playerX, playerY, cameraY) {
        if (this.collected) return false;
        
        const screenY = this.y - cameraY + this.floatY;
        const dx = playerX - this.x;
        const dy = playerY - screenY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 40;
    }
}

class Enemy {
    constructor(x, y, type, level) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = level;
        this.width = 50;
        this.height = 30;
        this.active = true;
        this.direction = 1;
        this.speed = 1 + level * 0.3;
        this.floatOffset = Math.random() * Math.PI * 2;
        
        switch(type) {
            case 'shark':
                this.width = 80;
                this.height = 40;
                this.emoji = '🦈';
                this.damage = 30 + level * 5;
                this.chaseRange = 300;
                break;
            case 'jellyfish':
                this.width = 40;
                this.height = 50;
                this.emoji = '🪼';
                this.damage = 20 + level * 3;
                this.vy = 1 + level * 0.2;
                break;
            case 'mine':
                this.width = 35;
                this.height = 35;
                this.emoji = '💣';
                this.damage = 50 + level * 10;
                this.exploding = false;
                break;
        }
    }

    update(playerX, playerY, cameraY) {
        const screenY = this.y - cameraY;
        
        if (this.type === 'shark') {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.chaseRange) {
                this.x += (dx / distance) * this.speed * 0.5;
                this.y += (dy / distance) * this.speed * 0.5;
                this.direction = dx > 0 ? 1 : -1;
            } else {
                this.x += this.speed * this.direction;
            }
        } else if (this.type === 'jellyfish') {
            this.y += Math.sin(Date.now() * 0.002 + this.floatOffset) * this.vy;
        }
        // Mine stays stationary
    }

    draw(ctx, cameraY) {
        if (!this.active) return;
        
        const screenY = this.y - cameraY;
        
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 10;
        ctx.font = `${this.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.type === 'shark' && this.direction < 0) {
            ctx.scale(-1, 1);
            ctx.fillText(this.emoji, -this.x, screenY);
        } else {
            ctx.fillText(this.emoji, this.x, screenY);
        }
        
        ctx.restore();
    }

    checkCollision(playerX, playerY, cameraY) {
        if (!this.active) return false;
        
        const screenY = this.y - cameraY;
        const dx = playerX - this.x;
        const dy = playerY - screenY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < 40;
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.width = 50;
        this.height = 60;
        this.x = game.canvas ? game.canvas.width / 2 : 400;
        this.y = game.canvas ? game.canvas.height / 2 : 300;
        this.vx = 0;
        this.vy = 0;
        this.acceleration = 0.5;
        this.maxSpeed = 6;
        this.friction = 0.95;
        this.health = 100;
        this.maxHealth = 100;
        this.oxygen = 100;
        this.maxOxygen = 100;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.flashTimer = 0;
        this.facing = 1;
        this.swimFrame = 0;
        
        // Load player image with proper path handling
        this.image = new Image();
        this.imageLoaded = false;
        
        const loadImage = () => {
            this.image.src = './duburi.jpeg';
        };
        
        this.image.onload = () => {
            console.log('Player image loaded successfully');
            this.imageLoaded = true;
        };
        
        this.image.onerror = (e) => {
            console.error('Failed to load player image from ./duburi.jpeg');
            // Fallback: create a canvas-based diver
            this.imageLoaded = false;
        };
        
        loadImage();
    }

    update(input) {
        // Movement with acceleration
        if (input.up) this.vy -= this.acceleration;
        if (input.down) this.vy += this.acceleration;
        if (input.left) this.vx -= this.acceleration;
        if (input.right) this.vx += this.acceleration;
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary checks
        const canvasWidth = this.game.canvas.width;
        const canvasHeight = this.game.canvas.height;
        
        if (this.x < this.width / 2) {
            this.x = this.width / 2;
            this.vx = 0;
        }
        if (this.x > canvasWidth - this.width / 2) {
            this.x = canvasWidth - this.width / 2;
            this.vx = 0;
        }
        if (this.y < this.height / 2) {
            this.y = this.height / 2;
            this.vy = 0;
        }
        
        // Update facing direction
        if (this.vx > 0.5) this.facing = 1;
        if (this.vx < -0.5) this.facing = -1;
        
        // Swim animation
        if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
            this.swimFrame += 0.2;
        }
        
        // Oxygen depletion
        this.oxygen -= 0.03;
        if (this.oxygen <= 0) {
            this.oxygen = 0;
            this.health -= 0.5;
        }
        
        // Invincibility timer
        if (this.invincible) {
            this.invincibleTimer--;
            this.flashTimer++;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        // Health check
        if (this.health <= 0) {
            this.health = 0;
            this.game.gameOver();
        }
    }

    draw(ctx, cameraY) {
        const screenY = this.y - cameraY;
        
        // Flash when invincible
        if (this.invincible && Math.floor(this.flashTimer / 4) % 2 === 0) {
            return;
        }
        
        ctx.save();
        
        // Add glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        
        // Calculate rotation based on movement
        const rotation = this.vx * 0.05;
        ctx.translate(this.x, screenY);
        ctx.rotate(rotation);
        
        if (this.facing < 0) {
            ctx.scale(-1, 1);
        }
        
        // Swim bobbing
        const bobOffset = Math.sin(this.swimFrame) * 3;
        
        if (this.imageLoaded && this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(
                this.image,
                -this.width / 2,
                -this.height / 2 + bobOffset,
                this.width,
                this.height
            );
        } else {
            // Fallback diver shape - more detailed
            // Body
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.ellipse(0, bobOffset, 20, 30, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Helmet
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, bobOffset - 25, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Visor
            ctx.fillStyle = '#87ceeb';
            ctx.beginPath();
            ctx.ellipse(3, bobOffset - 25, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Oxygen tank
            ctx.fillStyle = 'silver';
            ctx.fillRect(-15, bobOffset + 10, 30, 15);
            
            // Fins
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.moveTo(-10, bobOffset + 25);
            ctx.lineTo(-20, bobOffset + 35);
            ctx.lineTo(-5, bobOffset + 30);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(10, bobOffset + 25);
            ctx.lineTo(20, bobOffset + 35);
            ctx.lineTo(5, bobOffset + 30);
            ctx.fill();
        }
        
        ctx.restore();
    }

    takeDamage(amount) {
        if (this.invincible) return;
        
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = 120;
        this.flashTimer = 0;
        this.game.triggerScreenShake(10);
        this.game.audio.playDamage();
    }

    restoreOxygen(amount) {
        this.oxygen = Math.min(this.oxygen + amount, this.maxOxygen);
    }
}

class Background {
    constructor(game) {
        this.game = game;
        this.layers = [];
        this.generateLayers();
    }

    generateLayers() {
        // Far background - static elements
        this.farElements = [];
        for (let i = 0; i < 50; i++) {
            this.farElements.push({
                x: Math.random() * 2000,
                y: Math.random() * 3000,
                type: ['coral', 'seaweed', 'rock'][Math.floor(Math.random() * 3)],
                size: Math.random() * 30 + 20,
                emoji: ['🪸', '🌿', '🪨'][Math.floor(Math.random() * 3)]
            });
        }
        
        // Mid background
        this.midElements = [];
        for (let i = 0; i < 30; i++) {
            this.midElements.push({
                x: Math.random() * 2000,
                y: Math.random() * 3000,
                type: ['fish', 'bubble_cluster'][Math.floor(Math.random() * 2)],
                size: Math.random() * 20 + 10
            });
        }
    }

    draw(ctx, cameraY, depth) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Depth-based color gradient
        const maxDepth = 5000;
        const depthRatio = Math.min(depth / maxDepth, 1);
        
        // Ocean gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        const r1 = 0, g1 = 100 + depthRatio * 50, b1 = 150 + depthRatio * 50;
        const r2 = 0, g2 = 50 + depthRatio * 30, b2 = 100 + depthRatio * 80;
        
        gradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        gradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw far elements (parallax factor 0.3)
        ctx.save();
        ctx.globalAlpha = 0.5;
        this.farElements.forEach(el => {
            const screenY = el.y - cameraY * 0.3;
            if (screenY > -50 && screenY < height + 50) {
                ctx.font = `${el.size}px Arial`;
                ctx.fillText(el.emoji, el.x, screenY);
            }
        });
        ctx.restore();
        
        // Draw mid elements (parallax factor 0.6)
        ctx.save();
        ctx.globalAlpha = 0.7;
        this.midElements.forEach(el => {
            const screenY = el.y - cameraY * 0.6;
            if (screenY > -50 && screenY < height + 50 && el.type === 'fish') {
                const fishEmojis = ['🐟', '🐠', '🐡'];
                const emoji = fishEmojis[Math.floor(Math.random() * 3)];
                ctx.font = `${el.size}px Arial`;
                ctx.fillText(emoji, el.x, screenY);
            }
        });
        ctx.restore();
        
        // Depth fog overlay
        ctx.fillStyle = `rgba(0, 10, 30, ${depthRatio * 0.5})`;
        ctx.fillRect(0, 0, width, height);
        
        // Light rays from surface
        if (depth < 1000) {
            ctx.save();
            ctx.globalAlpha = 0.1 - depthRatio * 0.08;
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 5; i++) {
                const x = i * (width / 5) + width / 10;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x - 50, height);
                ctx.lineTo(x + 50, height);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        this.audio = new AudioManager();
        this.input = new InputManager(this);
        this.background = new Background(this);
        
        this.state = 'start'; // start, playing, paused, gameover
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('duburiNavidHighScore')) || 0;
        this.depth = 0;
        this.maxDepth = 0;
        this.level = 1;
        this.cameraY = 0;
        
        this.player = null;
        this.collectibles = [];
        this.enemies = [];
        this.particles = [];
        this.floatingTexts = [];
        
        this.screenShake = 0;
        this.shakeIntensity = 0;
        
        this.lastTime = 0;
        this.spawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        
        this.setupEventListeners();
        this.initParticles();
        
        // Check for mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            document.getElementById('mobile-controls').classList.remove('hidden');
        }
        
        this.updateHUD();
        this.animate(0);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        // Start button
        document.getElementById('btn-start').addEventListener('click', () => {
            this.audio.init();
            this.audio.playClick();
            this.startGame();
        });
        
        // How to play
        document.getElementById('btn-how-to-play').addEventListener('click', () => {
            this.audio.init();
            this.audio.playClick();
            document.getElementById('how-to-play-modal').classList.add('active');
        });
        
        document.getElementById('btn-close-modal').addEventListener('click', () => {
            this.audio.playClick();
            document.getElementById('how-to-play-modal').classList.remove('active');
        });
        
        // Sound toggle
        const soundBtn = document.getElementById('btn-sound-toggle');
        soundBtn.addEventListener('click', () => {
            this.audio.enabled = !this.audio.enabled;
            soundBtn.textContent = `Sound: ${this.audio.enabled ? 'ON' : 'OFF'}`;
            this.audio.playClick();
        });
        
        // Pause button
        document.getElementById('btn-pause').addEventListener('click', () => {
            if (this.state === 'playing') {
                this.togglePause();
            }
        });
        
        // Resume
        document.getElementById('btn-resume').addEventListener('click', () => {
            this.audio.playClick();
            this.togglePause();
        });
        
        // Restart from pause
        document.getElementById('btn-restart-pause').addEventListener('click', () => {
            this.audio.playClick();
            this.startGame();
        });
        
        // Main menu from pause
        document.getElementById('btn-main-menu-pause').addEventListener('click', () => {
            this.audio.playClick();
            this.showMainMenu();
        });
        
        // Play again
        document.getElementById('btn-play-again').addEventListener('click', () => {
            this.audio.playClick();
            this.startGame();
        });
        
        // Main menu from game over
        document.getElementById('btn-main-menu-go').addEventListener('click', () => {
            this.audio.playClick();
            this.showMainMenu();
        });
    }

    initParticles() {
        for (let i = 0; i < 100; i++) {
            this.particles.push(new Bubble(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height + i * 10
            ));
        }
    }

    startGame() {
        this.player = new Player(this);
        console.log('Player created at:', this.player.x, this.player.y);
        console.log('Canvas size:', this.canvas.width, this.canvas.height);
        this.collectibles = [];
        this.enemies = [];
        this.floatingTexts = [];
        this.score = 0;
        this.depth = 0;
        this.maxDepth = 0;
        this.level = 1;
        this.cameraY = 0;
        this.screenShake = 0;
        
        // Initial collectibles
        for (let i = 0; i < 10; i++) {
            this.spawnCollectible();
        }
        
        // Initial enemies
        for (let i = 0; i < 3; i++) {
            this.spawnEnemy();
        }
        
        this.hideAllScreens();
        document.getElementById('hud').classList.remove('hidden');
        this.state = 'playing';
        this.updateHUD();
    }

    hideAllScreens() {
        document.querySelectorAll('.screen, .modal').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
    }

    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('mobile-controls').classList.add('hidden');
        this.state = 'start';
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-screen').classList.remove('hidden');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pause-screen').classList.add('hidden');
        }
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.playGameOver();
        
        // Save high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('duburiNavidHighScore', this.highScore.toString());
        }
        
        // Update game over screen
        document.getElementById('go-final-score').textContent = this.score;
        document.getElementById('go-best-score').textContent = this.highScore;
        document.getElementById('go-max-depth').textContent = Math.floor(this.maxDepth) + 'm';
        document.getElementById('go-level').textContent = this.level;
        
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    spawnCollectible() {
        const types = ['coin', 'coin', 'coin', 'treasure', 'oxygen'];
        if (this.level >= 2) types.push('artifact');
        if (this.level >= 4) types.push('bonus');
        
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const y = this.cameraY + Math.random() * this.canvas.height + 200;
        
        this.collectibles.push(new Collectible(x, y, type));
    }

    spawnEnemy() {
        const types = ['jellyfish'];
        if (this.level >= 1) types.push('shark');
        if (this.level >= 2) types.push('mine');
        
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (this.canvas.width - 100) + 50;
        const y = this.cameraY + Math.random() * this.canvas.height + 200;
        
        this.enemies.push(new Enemy(x, y, type, this.level));
    }

    triggerScreenShake(intensity) {
        this.shakeIntensity = intensity;
        this.screenShake = intensity;
    }

    showFloatingText(x, y, text, color) {
        this.floatingTexts.push(new FloatingText(x, y, text, color));
    }

    updateLevel() {
        const newLevel = Math.floor(this.depth / 1000) + 1;
        if (newLevel > this.level && newLevel <= 5) {
            this.level = newLevel;
            this.audio.playLevelUp();
            this.showFloatingText(this.canvas.width / 2, this.canvas.height / 2, `LEVEL ${this.level}!`, '#00ffff');
            
            // Spawn more enemies
            for (let i = 0; i < this.level; i++) {
                this.spawnEnemy();
            }
        }
    }

    updateHUD() {
        document.getElementById('hud-score').textContent = this.score;
        document.getElementById('hud-best-score').textContent = this.highScore;
        document.getElementById('hud-level').textContent = this.level;
        document.getElementById('hud-depth').textContent = Math.floor(this.depth) + 'm';
        
        if (!this.player) return;
        
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('hud-health-bar').style.width = healthPercent + '%';
        
        const oxygenPercent = (this.player.oxygen / this.player.maxOxygen) * 100;
        const oxygenBar = document.getElementById('hud-oxygen-bar');
        oxygenBar.style.width = oxygenPercent + '%';
        
        if (oxygenPercent < 20) {
            oxygenBar.classList.add('warning');
            if (Date.now() % 1000 < 500) {
                this.audio.playOxygenWarning();
            }
        } else {
            oxygenBar.classList.remove('warning');
        }
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        const input = this.input.getInput();
        this.player.update(input);
        
        // Update camera to follow player
        const targetCameraY = this.player.y - this.canvas.height / 2;
        this.cameraY += (targetCameraY - this.cameraY) * 0.1;
        
        // Ensure camera doesn't go above surface
        if (this.cameraY < 0) this.cameraY = 0;
        
        // Update depth
        this.depth = Math.max(this.depth, this.player.y / 5);
        this.maxDepth = Math.max(this.maxDepth, this.depth);
        this.updateLevel();
        
        // Spawn collectibles
        this.collectibleSpawnTimer++;
        if (this.collectibleSpawnTimer > 120) {
            this.collectibleSpawnTimer = 0;
            this.spawnCollectible();
        }
        
        // Spawn enemies
        this.spawnTimer++;
        const spawnRate = Math.max(60, 180 - this.level * 20);
        if (this.spawnTimer > spawnRate) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
        
        // Update collectibles
        this.collectibles.forEach(c => c.update(Date.now()));
        
        // Remove off-screen collectibles
        this.collectibles = this.collectibles.filter(c => 
            c.y > this.cameraY - 100 && c.y < this.cameraY + this.canvas.height + 100 && !c.collected
        );
        
        // Update enemies
        this.enemies.forEach(e => e.update(this.player.x, this.player.y, this.cameraY));
        
        // Remove off-screen enemies
        this.enemies = this.enemies.filter(e => 
            e.y > this.cameraY - 100 && e.y < this.cameraY + this.canvas.height + 100 && e.active
        );
        
        // Update particles
        this.particles.forEach(p => p.update());
        
        // Update floating texts
        this.floatingTexts.forEach(t => t.update());
        this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
        
        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update HUD
        this.updateHUD();
    }

    checkCollisions() {
        // Collectible collisions
        this.collectibles.forEach(c => {
            if (c.checkCollision(this.player.x, this.player.y, this.cameraY)) {
                c.collected = true;
                
                if (c.type === 'oxygen') {
                    this.player.restoreOxygen(30);
                    this.showFloatingText(this.player.x, this.player.y - this.cameraY, '+OXYGEN', '#44aaff');
                } else {
                    this.score += c.points;
                    this.showFloatingText(this.player.x, this.player.y - this.cameraY, `+${c.points}`, c.color);
                    
                    if (c.points >= 100) {
                        this.audio.playTreasure();
                    } else {
                        this.audio.playCoin();
                    }
                }
            }
        });
        
        // Enemy collisions
        this.enemies.forEach(e => {
            if (e.checkCollision(this.player.x, this.player.y, this.cameraY)) {
                if (e.type === 'mine') {
                    e.active = false;
                    this.audio.playExplosion();
                    this.triggerScreenShake(20);
                }
                this.player.takeDamage(e.damage);
            }
        });
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const dx = (Math.random() - 0.5) * this.screenShake;
            const dy = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(dx, dy);
        }
        
        // Draw background
        this.background.draw(this.ctx, this.cameraY, this.depth);
        
        // Draw particles
        this.particles.forEach(p => p.draw(this.ctx));
        
        // Draw collectibles
        this.collectibles.forEach(c => c.draw(this.ctx, this.cameraY));
        
        // Draw enemies
        this.enemies.forEach(e => e.draw(this.ctx, this.cameraY));
        
        // Draw player
        if (this.player) {
            this.player.draw(this.ctx, this.cameraY);
        }
        
        // Draw floating texts
        this.floatingTexts.forEach(t => t.draw(this.ctx));
        
        this.ctx.restore();
    }

    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((t) => this.animate(t));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
