// Game State Variables
let canvas, ctx;
let isPlaying = false;
let isDragging = false;
let mudPie = null;
let slingshot = null;
let stopwatchInterval = null;
let stopwatchStartTime = 0;
let stopwatchElapsed = 0;
let musicPlaying = true;
let audioElement = null;
let splatSound = null;
let splats = [];
let animationId = null;
let windTarget = 0;
let audioInitialized = false;
let gameStarting = false;

// Physics Constants
const GRAVITY = 0.5;
const GROUND_Y = 0; // Will be set based on canvas height
const LAUNCH_X = 150;
const LAUNCH_Y = 0; // Will be set based on canvas height

// Wind Configuration
let windSpeed = 0;
let windDirection = 1; // 1 for right, -1 for left

// Camera Configuration
let cameraX = 0;
let cameraY = 0;

// Slingshot Configuration
const SLINGSHOT_WIDTH = 40;
const SLINGSHOT_HEIGHT = 120;
const MAX_PULL_DISTANCE = 400;
const POWER_MULTIPLIER = 0.35;

// DOM Elements
let homeMenu, gameplay, musicToggle, musicToggleGame;
let highestScoreEl, lastScoreEl, playButton, resetButton, howToPlayButton;
let stopwatchEl, distanceDisplay, distanceEl, returnButton, playAgainButton, gameCanvas;
let aboutButton;

/**
 * Initialize the game menu and load scores from localStorage
 */
function initMenu() {
    // Get DOM elements
    homeMenu = document.getElementById('homeMenu');
    gameplay = document.getElementById('gameplay');
    musicToggle = document.getElementById('musicToggle');
    musicToggleGame = document.getElementById('musicToggleGame');
    highestScoreEl = document.getElementById('highestScore');
    lastScoreEl = document.getElementById('lastScore');
    playButton = document.getElementById('playButton');
    resetButton = document.getElementById('resetButton');
    howToPlayButton = document.getElementById('howToPlayButton');
    stopwatchEl = document.getElementById('stopwatch');
    distanceDisplay = document.getElementById('distanceDisplay');
    distanceEl = document.getElementById('distance');
    returnButton = document.getElementById('returnButton');
    playAgainButton = document.getElementById('playAgainButton');
    gameCanvas = document.getElementById('gameCanvas');
    aboutButton = document.getElementById('aboutButton');

    // Load scores from localStorage
    const highestScore = localStorage.getItem('highestScore') || '0';
    const lastScore = localStorage.getItem('lastScore') || '0';

    highestScoreEl.textContent = highestScore;
    lastScoreEl.textContent = lastScore;

playButton.addEventListener('click', () => {
    if (gameStarting || isPlaying) return;

    console.log("PLAY CLICKED");

    gameStarting = true;
    playButton.disabled = true;

    startGame();

  
    
    resetButton.addEventListener('click', resetProgress);
    howToPlayButton.addEventListener('click', () => {
        window.location.href = 'how-to-play.html';
    });
    musicToggle.addEventListener('click', toggleMusic);
    musicToggleGame.addEventListener('click', toggleMusic);
    returnButton.addEventListener('click', returnToMenu);
    playAgainButton.addEventListener('click', playAgain);
    aboutButton.addEventListener('click', () => {
        window.location.href = 'about.html';
    });

}

/**
 * Initialize audio element for background music
 */
function initAudio() {
    if (audioInitialized) return;

    try {
        audioElement = new Audio();
        audioElement.src = './assets/music.mp3';
        audioElement.loop = true;
        audioElement.volume = 0.5;
        audioElement.preload = 'auto';

        // Fallback: manually loop when audio ends
        audioElement.addEventListener('ended', () => {
            if (musicPlaying) {
                audioElement.currentTime = 0;
                audioElement.play().catch(e => console.log('Audio loop failed:', e));
            }
        });

        // Initialize splat sound
        splatSound = new Audio();
        splatSound.src = './assets/splat.wav';
        splatSound.volume = 0.7;
        splatSound.preload = 'auto';

        audioInitialized = true;

        // Start music by default
        if (musicPlaying) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => {
                console.log('Audio play failed:', e);
                musicPlaying = false;
                updateMusicToggleButton();
            });
        }
        
        updateMusicToggleButton();
    } catch (error) {
        console.error('Failed to initialize audio:', error);
    }
}

/**
 * Update music toggle button appearance
 */
function updateMusicToggleButton() {
    const icon = musicPlaying ? '🎵' : '🔇';
    musicToggle.textContent = icon;
    musicToggleGame.textContent = icon;
}

/**
 * Toggle music on/off
 */
function toggleMusic() {
    if (!audioInitialized) {
        initAudio();
    }

    musicPlaying = !musicPlaying;

    if (musicPlaying) {
        updateMusicToggleButton();
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();

        if (playPromise !== undefined) {
            playPromise
                .catch(e => {
                    console.log('Audio play failed:', e);
                    musicPlaying = false;
                    updateMusicToggleButton();
                });
        }
    } else {
        updateMusicToggleButton();
        audioElement.pause();
    }
}

/**
 * Play splat sound effect
 */
function playSplatSound() {
    if (!splatSound) {
        console.log('Splat sound not initialized');
        return;
    }

    try {
        splatSound.currentTime = 0;
        const playPromise = splatSound.play();

        if (playPromise !== undefined) {
            playPromise.catch(e => console.log('Splat sound play failed:', e));
        }
    } catch (error) {
        console.log('Error playing splat sound:', error);
    }
}

/**
 * Create visual splat effect
 */
function createSplat(x, y) {
    // Create multiple splat particles
    for (let i = 0; i < 8; i++) {
        splats.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 10,
            radius: 5 + Math.random() * 15,
            color: `hsl(${30 + Math.random() * 20}, 70%, ${30 + Math.random() * 20}%)`,
            alpha: 1
        });
    }
}

/**
 * Draw splat effects
 */
function drawSplats() {
    splats.forEach(splat => {
        ctx.beginPath();
        ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
        ctx.fillStyle = splat.color;
        ctx.globalAlpha = splat.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

/**
 * Reset all progress (clear localStorage)
 */
function resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        localStorage.removeItem('highestScore');
        localStorage.removeItem('lastScore');
        highestScoreEl.textContent = '0';
        lastScoreEl.textContent = '0';
    }
}

/**
 * Play again - reset game without returning to menu
 */
function playAgain() {
    stopStopwatch();
    // Reset mud pie
    mudPie = {
        x: slingshot.x + slingshot.width / 2,
        y: slingshot.y - slingshot.height / 2,
        radius: 20,
        vx: 0,
        vy: 0,
        isLaunched: false,
        isLanded: false,
        startX: slingshot.x + slingshot.width / 2,
        startY: slingshot.y - slingshot.height / 2
    };

    // Reset camera
    cameraX = 0;

    // Clear splats
    splats = [];

    // Hide distance display and game buttons
    distanceDisplay.classList.add('hidden');
    document.querySelector('.game-buttons').classList.add('hidden');

    // Reset stopwatch
    stopwatchElapsed = 0;
    stopwatchEl.textContent = '00:00:00.000';
}

/**
 * Start the game and switch to gameplay mode
 */
function startGame() {
    // Ensure audio is initialized on first game start
    if (!audioInitialized) {
        initAudio();
    }

    // Reset everything
    isPlaying = true;
    isDragging = false;
    cameraX = 0;
    cameraY = 0;
    splats = [];

    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }

    stopwatchElapsed = 0;

    // Randomize wind
    randomizeWind();

    // Switch to gameplay view
    homeMenu.classList.add('hidden');
    gameplay.classList.remove('hidden');

    // Hide distance display and game buttons
    distanceDisplay.classList.add('hidden');
    document.querySelector('.game-buttons').classList.add('hidden');

    // Initialize canvas
    canvas = gameCanvas;
    ctx = canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize game objects
    slingshot = {
        x: LAUNCH_X,
        y: canvas.height - 100,
        width: SLINGSHOT_WIDTH,
        height: SLINGSHOT_HEIGHT
    };

    mudPie = {
        x: slingshot.x + slingshot.width / 2,
        y: slingshot.y - slingshot.height / 2,
        radius: 20,
        vx: 0,
        vy: 0,
        isLaunched: false,
        isLanded: false,
        startX: slingshot.x + slingshot.width / 2,
        startY: slingshot.y - slingshot.height / 2
    };

    // Set up canvas event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    // Set up keyboard controls
    window.addEventListener('keydown', handleKeyDown);

    // Reset stopwatch
    stopwatchElapsed = 0;
    stopwatchEl.textContent = '00:00:00.000';

// Start game loop
if (animationId) {
    cancelAnimationFrame(animationId);
}

animationId = requestAnimationFrame(gameLoop);
console.log("GAME LOOP STARTED");

    }

/**
 * Randomize wind conditions
 */
function randomizeWind() {
    windTarget = (Math.random() * 0.6 - 0.3);
    windSpeed = Math.random() * 0.3; // 0 to 0.3
    windDirection = Math.random() > 0.5 ? 1 : -1;
}

/**
 * Resize canvas to fit window
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (slingshot) {
        slingshot.y = canvas.height - 100;
    }
}

/**
 * Handle mouse down event
 */
function handleMouseDown(e) {
    if (!isPlaying || mudPie.isLaunched) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicking on mud pie
    const dist = Math.sqrt(
        Math.pow(mouseX - mudPie.x, 2) +
        Math.pow(mouseY - mudPie.y, 2)
    );

    if (dist <= mudPie.radius + 20) {
        isDragging = true;
    }
}

/**
 * Handle mouse move event
 */
function handleMouseMove(e) {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate pull distance and angle
    const dx = mudPie.startX - mouseX;
    const dy = mudPie.startY - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Limit pull distance
    const limitedDistance = Math.min(distance, MAX_PULL_DISTANCE);
    const angle = Math.atan2(dy, dx);

    // Update mud pie position while dragging
    mudPie.x = mudPie.startX - Math.cos(angle) * limitedDistance;
    mudPie.y = mudPie.startY - Math.sin(angle) * limitedDistance;
}

/**
 * Handle mouse up event - launch the mud pie
 */
function handleMouseUp(e) {
    if (!isDragging) return;

    isDragging = false;
    launchMudPie();
}

/**
 * Handle touch start event
 */
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
}

/**
 * Handle touch move event
 */
function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
}

/**
 * Handle touch end event
 */
function handleTouchEnd(e) {
    e.preventDefault();
    handleMouseUp(e);
}

/**
 * Handle keyboard controls
 */
function handleKeyDown(e) {
    if (!isPlaying) return;

    switch (e.key.toLowerCase()) {
        case ' ':
            // Space: Play again after throw
            if (mudPie.isLanded) {
                playAgain();
            }
            e.preventDefault();
            break;
        case 'r':
            // R: Return to menu
            returnToMenu();
            break;
        case 'm':
            // M: Toggle music
            toggleMusic();
            break;
    }
}

/**
 * Launch the mud pie with physics trajectory
 */
function launchMudPie() {
    if (mudPie.isLaunched) return;

    mudPie.isLaunched = true;

    mudPie.vx = 0;
    mudPie.vy = 0;

    // Calculate velocity based on pull distance
    const dx = mudPie.startX - mudPie.x;
    const dy = mudPie.startY - mudPie.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Apply power multiplier
    const power = distance * POWER_MULTIPLIER;
    const angle = Math.atan2(dy, dx);

    mudPie.vx = Math.cos(angle) * power;
    mudPie.vy = Math.sin(angle) * power;

    // Start stopwatch
    startStopwatch();
}

/**
 * Start the stopwatch
 */
function startStopwatch() {
    stopwatchStartTime = Date.now();

    stopwatchInterval = setInterval(() => {
        updateStopwatch();
    }, 10);
}

/**
 * Update the stopwatch display
 */
function updateStopwatch() {
    const elapsed = Date.now() - stopwatchStartTime;
    stopwatchElapsed = elapsed;

    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const milliseconds = elapsed % 1000;

    const formatted =
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0') + '.' +
        String(milliseconds).padStart(3, '0');

    stopwatchEl.textContent = formatted;
}

/**
 * Stop the stopwatch
 */
function stopStopwatch() {
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }
}

/**
 * Main game loop
 */
function gameLoop() {
     console.log("FRAME RUNNING");
    if (!isPlaying) {
        animationId = null;
        return;
    }

    update();
    draw();

    animationId = requestAnimationFrame(gameLoop);
}

/**
 * Update game physics
 */
    
function update() {
    // Always update camera if the mud pie exists
    if (mudPie) {
        updateCamera();
    }

    if (mudPie.isLaunched && !mudPie.isLanded) {
        // Apply gravity
        mudPie.vy += GRAVITY;

        // Apply wind
        mudPie.vx += windSpeed * windDirection;

        // Move
        mudPie.x += mudPie.vx;
        mudPie.y += mudPie.vy;

        // Update wind conditions
        windSpeed += (Math.abs(windTarget) - windSpeed) * 0.01;
        windDirection = windTarget >= 0 ? 1 : -1;

        // Randomly change wind target
        if (Math.random() < 0.003) {
            windTarget = Math.random() * 0.6 - 0.3;
        }

        // Check if mud pie has landed
        const groundY = canvas.height - 50;

        if (
            mudPie.y + mudPie.radius >= groundY ||
            mudPie.x > mudPie.startX + 5000 ||
            mudPie.y > canvas.height + 100
        ) {
            mudPie.isLanded = true;
            stopStopwatch();

            playSplatSound();

            createSplat(mudPie.x, canvas.height - 50);

            const distance = Math.floor(
                Math.abs(mudPie.x - mudPie.startX) / 10
            );

            distanceEl.textContent = distance;
            distanceDisplay.classList.remove('hidden');
            document.querySelector('.game-buttons').classList.remove('hidden');

            checkScore(distance);
            highestScoreEl.textContent = localStorage.getItem('highestScore');
            lastScoreEl.textContent = localStorage.getItem('highestScore');
        }
    }
}

/**
 * Update camera to follow mud pie
 */
function updateCamera() {
    if (!mudPie || !mudPie.isLaunched) {
        cameraX = 0;
        return;
    }

    const targetCameraX = mudPie.x - canvas.width / 2;

    cameraX += (targetCameraX - cameraX) * 0.12;

    if (cameraX < 0) {
        cameraX = 0;
    }
}

/**
 * Draw game elements
 */
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for camera transform
    ctx.save();

    // Apply camera transform
    ctx.translate(-cameraX, cameraY);

    // Draw background (extended for camera movement)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(cameraX - 100, 0, canvas.width + 200, canvas.height);

    // Draw ground (extended)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(cameraX - 100, canvas.height - 50, canvas.width + 200, 50);

    // Draw grass (extended)
    ctx.fillStyle = '#228B22';
    ctx.fillRect(cameraX - 100, canvas.height - 60, canvas.width + 200, 15);

    // Draw slingshot
    drawSlingshot();

    // Draw mud pie
    drawMudPie();

    // Draw splat effects
    drawSplats();

    // Draw trajectory line when dragging
    if (isDragging) {
        drawTrajectory();
    }

    // Restore context
    ctx.restore();

    // Draw UI elements (not affected by camera)
    drawUI();
}

/**
 * Draw UI elements (not affected by camera)
 */
function drawUI() {
    // Draw distance marker on screen
    if (mudPie.isLaunched && !mudPie.isLanded) {
        const currentDistance = Math.floor(Math.abs(mudPie.x - mudPie.startX) / 10);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, 80, 200, 40);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Distance: ${currentDistance}m`, 30, 105);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, 130, 220, 40);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        const arrow = windDirection === 1 ? '→' : '←';
        ctx.fillText(
            `Wind ${arrow} ${(windSpeed * 100).toFixed(0)}%`,
            30,
            155
        );
    }
}

/**
 * Draw the slingshot
 */
function drawSlingshot() {
    const x = slingshot.x;
    const y = slingshot.y;

    // Draw slingshot base
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 10, y, 20, 30);

    // Draw slingshot arms
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(x - 25, y - slingshot.height, 15, slingshot.height);
    ctx.fillRect(x + 10, y - slingshot.height, 15, slingshot.height);

    // Draw slingshot band
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 4;

    if (isDragging) {
        // Draw band from arm to mud pie
        ctx.beginPath();
        ctx.moveTo(x - 18, y - slingshot.height + 10);
        ctx.lineTo(mudPie.x, mudPie.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 18, y - slingshot.height + 10);
        ctx.lineTo(mudPie.x, mudPie.y);
        ctx.stroke();
    } else if (!mudPie.isLaunched) {
        // Draw band between arms
        ctx.beginPath();
        ctx.moveTo(x - 18, y - slingshot.height + 10);
        ctx.lineTo(x + 18, y - slingshot.height + 10);
        ctx.stroke();
    }
}

/**
 * Draw the mud pie
 */
function drawMudPie() {
    ctx.beginPath();
    ctx.arc(mudPie.x, mudPie.y, mudPie.radius, 0, Math.PI * 2);

    // Mud pie color
    const gradient = ctx.createRadialGradient(
        mudPie.x - 5, mudPie.y - 5, 0,
        mudPie.x, mudPie.y, mudPie.radius
    );
    gradient.addColorStop(0, '#8B7355');
    gradient.addColorStop(1, '#5D4037');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Mud pie outline
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Add some texture
    ctx.fillStyle = '#6D4C41';
    ctx.beginPath();
    ctx.arc(mudPie.x - 5, mudPie.y - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mudPie.x + 3, mudPie.y + 3, 4, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw trajectory preview when dragging
 */
function drawTrajectory() {
    const dx = mudPie.startX - mudPie.x;
    const dy = mudPie.startY - mudPie.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = distance * POWER_MULTIPLIER;
    const angle = Math.atan2(dy, dx);

    let vx = Math.cos(angle) * power;
    let vy = Math.sin(angle) * power;
    let px = mudPie.startX;
    let py = mudPie.startY;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(px, py);

    // Simulate trajectory with wind effect
    let simWind = windSpeed;
    let simDir = windDirection;

    for (let i = 0; i < 100; i++) {
        vy += GRAVITY;
        vx += simWind * simDir;

        px += vx;
        py += vy;

        if (py > canvas.height - 50) break;

        ctx.lineTo(px, py);
    }

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw power indicator
    drawPowerIndicator(distance);
}

/**
 * Draw power indicator bar
 */
function drawPowerIndicator(pullDistance) {
    const powerPercent = pullDistance / MAX_PULL_DISTANCE;
    const barWidth = 200;
    const barHeight = 20;
    const barX = slingshot.x + slingshot.width / 2 - barWidth / 2;
    const barY = slingshot.y - slingshot.height - 40;

    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Power fill - color changes from green to red based on power
    const powerColor = getPowerColor(powerPercent);
    ctx.fillStyle = powerColor;
    ctx.fillRect(barX, barY, barWidth * powerPercent, barHeight);

    // Border
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('POWER', barX + barWidth / 2, barY - 5);
}

/**
 * Get color based on power percentage
 */
function getPowerColor(percent) {
    // Green to yellow to red gradient
    if (percent < 0.5) {
        // Green to yellow
        const r = Math.floor(255 * (percent * 2));
        const g = 255;
        return `rgb(${r}, ${g}, 0)`;
    } else {
        // Yellow to red
        const r = 255;
        const g = Math.floor(255 * (1 - (percent - 0.5) * 2));
        return `rgb(${r}, ${g}, 0)`;
    }
}

/**
 * Check and update scores in localStorage
 */
function checkScore(distance) {
    const highestScore = parseInt(localStorage.getItem('highestScore') || '0');
    const lastScore = parseInt(localStorage.getItem('lastScore') || '0');

    // Update last score
    localStorage.setItem('lastScore', distance.toString());

    // Update highest score if new record
    if (distance > highestScore) {
        localStorage.setItem('highestScore', distance.toString());
    }
}

/**
 * Return to home menu
 */
function returnToMenu() {
    isPlaying = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Stop game loop
    stopStopwatch();

    // Remove event listeners
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('keydown', handleKeyDown);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    mudPie = null;
    slingshot = null;
    cameraX = 0;
    cameraY = 0;
    splats = [];
    isDragging = false;

    // Switch to home menu
    gameplay.classList.add('hidden');
    homeMenu.classList.remove('hidden');

    // Reload scores
    const highestScore = localStorage.getItem('highestScore') || '0';
    const lastScore = localStorage.getItem('lastScore') || '0';

    highestScoreEl.textContent = highestScore;
    lastScoreEl.textContent = lastScore;

    gameStarting = false;
    playButton.disabled = false;
}

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initMenu);
