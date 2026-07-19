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
let achievementPoints = 0;
let unlockedAchievements = [];

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
let aboutButton, achievementPointsEl, achievementsButton, achievementsModal, closeAchievements;
let achievementsList, unlockedCountEl, totalAchievementsEl;

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
    achievementPointsEl = document.getElementById('achievementPoints');
    achievementsButton = document.getElementById('achievementsButton');
    achievementsModal = document.getElementById('achievementsModal');
    closeAchievements = document.getElementById('closeAchievements');
    achievementsList = document.getElementById('achievementsList');
    unlockedCountEl = document.getElementById('unlockedCount');
    totalAchievementsEl = document.getElementById('totalAchievements');

    // Load scores from localStorage
    const highestScore = localStorage.getItem('highestScore') || '0';
    const lastScore = localStorage.getItem('lastScore') || '0';
    achievementPoints = parseInt(localStorage.getItem('achievementPoints') || '0');
    unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');
    totalThrows = parseInt(localStorage.getItem('totalThrows') || '0');

    highestScoreEl.textContent = highestScore;
    lastScoreEl.textContent = lastScore;
    achievementPointsEl.textContent = achievementPoints;
    
    // Mark achievements as unlocked based on saved data
    achievements.forEach(achievement => {
        achievement.unlocked = unlockedAchievements.includes(achievement.id);
    });

playButton.addEventListener('click', () => {
    if (gameStarting || isPlaying) return;

    console.log("PLAY CLICKED");

    // Initialize audio on first user interaction
    if (!audioInitialized) {
        initAudio();
    }

    gameStarting = true;
    playButton.disabled = true;

    startGame();

    });

  
    
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
    achievementsButton.addEventListener('click', showAchievements);
    closeAchievements.addEventListener('click', hideAchievements);

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
        localStorage.removeItem('achievementPoints');
        localStorage.removeItem('unlockedAchievements');
        localStorage.removeItem('totalThrows');
        highestScoreEl.textContent = '0';
        lastScoreEl.textContent = '0';
        achievementPoints = 0;
        unlockedAchievements = [];
        totalThrows = 0;
        currentStreak = 0;
        achievementPointsEl.textContent = '0';
        
        // Reset achievements
        achievements.forEach(a => a.unlocked = false);
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
    
    // Store power for achievement checking
    lastThrowPower = distance / MAX_PULL_DISTANCE;

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

            checkScore(distance, stopwatchElapsed, windSpeed, lastThrowPower);
            highestScoreEl.textContent = localStorage.getItem('highestScore');
            lastScoreEl.textContent = localStorage.getItem('lastScore');
            achievementPointsEl.textContent = achievementPoints;
        }
    }
}

/**
 * Update camera to follow mud pie
 */
function updateCamera() {
    if (!mudPie || !mudPie.isLaunched) {
        cameraX = 0;
        cameraY = 0;
        return;
    }

    const targetCameraX = mudPie.x - canvas.width / 2;

    cameraX += (targetCameraX - cameraX) * 0.12;

    if (cameraX < 0) {
        cameraX = 0;
    }

    cameraY = 0;
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
        
        // Styled distance box
        ctx.fillStyle = 'rgba(139, 69, 19, 0.9)';
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        roundRect(ctx, 15, 75, 220, 50, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Distance: ${currentDistance}m`, 30, 108);
        
        // Styled wind box
        ctx.fillStyle = 'rgba(34, 139, 34, 0.9)';
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 3;
        roundRect(ctx, 15, 135, 240, 50, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        const arrow = windDirection === 1 ? '→' : '←';
        ctx.fillText(
            `Wind ${arrow} ${(windSpeed * 100).toFixed(0)}%`,
            30,
            168
        );
    }
}

/**
 * Draw rounded rectangle helper function
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
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
 * Generate achievements with varied, harder requirements
 */
function generateAchievements() {
    const achievements = [];
    
    // Distance achievements (much harder scaling - more milestones)
    const distanceMilestones = [25, 50, 75, 100, 150, 200, 300, 400, 500, 600, 750, 900, 1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7500, 9000, 10000, 12500, 15000, 20000, 30000, 40000, 50000, 75000, 100000];
    distanceMilestones.forEach((distance, index) => {
        achievements.push({
            id: `distance_${distance}`,
            name: `Distance Master ${index + 1}`,
            description: `Throw ${distance} meters`,
            requiredDistance: distance,
            unlocked: false,
            category: 'distance'
        });
    });
    
    // Total throws achievements (much harder - more milestones)
    const throwMilestones = [5, 10, 25, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 25000, 50000];
    throwMilestones.forEach(throws => {
        achievements.push({
            id: `throws_${throws}`,
            name: `Persistent Thrower`,
            description: `Complete ${throws} throws`,
            requiredThrows: throws,
            unlocked: false,
            category: 'throws'
        });
    });
    
    // Wind achievements (throw in specific wind conditions - harder - more variety)
    achievements.push({
        id: 'wind_master',
        name: 'Wind Master',
        description: 'Throw 1000m with 25%+ wind',
        requiredDistance: 1000,
        requiredWind: 25,
        unlocked: false,
        category: 'wind'
    });
    
    achievements.push({
        id: 'calm_thrower',
        name: 'Calm Thrower',
        description: 'Throw 500m with <3% wind',
        requiredDistance: 500,
        requiredLowWind: 3,
        unlocked: false,
        category: 'wind'
    });
    
    achievements.push({
        id: 'wind_surfer',
        name: 'Wind Surfer',
        description: 'Throw 2000m with 20%+ wind against you',
        requiredDistance: 2000,
        requiredWind: 20,
        requiredAgainstWind: true,
        unlocked: false,
        category: 'wind'
    });
    
    achievements.push({
        id: 'breezy',
        name: 'Breezy Day',
        description: 'Throw 300m with 15%+ wind',
        requiredDistance: 300,
        requiredWind: 15,
        unlocked: false,
        category: 'wind'
    });
    
    achievements.push({
        id: 'storm_chaser',
        name: 'Storm Chaser',
        description: 'Throw 5000m with 30%+ wind',
        requiredDistance: 5000,
        requiredWind: 30,
        unlocked: false,
        category: 'wind'
    });
    
    achievements.push({
        id: 'still_air',
        name: 'Still Air',
        description: 'Throw 200m with <1% wind',
        requiredDistance: 200,
        requiredLowWind: 1,
        unlocked: false,
        category: 'wind'
    });
    
    // Time achievements (fast throws - much harder - more variety)
    achievements.push({
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Throw 300m in under 2 seconds',
        requiredDistance: 300,
        maxTime: 2000,
        unlocked: false,
        category: 'time'
    });
    
    achievements.push({
        id: 'marathon',
        name: 'Marathon',
        description: 'Throw 1500m in under 8 seconds',
        requiredDistance: 1500,
        maxTime: 8000,
        unlocked: false,
        category: 'time'
    });
    
    achievements.push({
        id: 'lightning',
        name: 'Lightning Fast',
        description: 'Throw 500m in under 1 second',
        requiredDistance: 500,
        maxTime: 1000,
        unlocked: false,
        category: 'time'
    });
    
    achievements.push({
        id: 'quick_start',
        name: 'Quick Start',
        description: 'Throw 100m in under 1.5 seconds',
        requiredDistance: 100,
        maxTime: 1500,
        unlocked: false,
        category: 'time'
    });
    
    achievements.push({
        id: 'endurance',
        name: 'Endurance',
        description: 'Throw 3000m in under 15 seconds',
        requiredDistance: 3000,
        maxTime: 15000,
        unlocked: false,
        category: 'time'
    });
    
    achievements.push({
        id: 'flash',
        name: 'Flash',
        description: 'Throw 200m in under 0.8 seconds',
        requiredDistance: 200,
        maxTime: 800,
        unlocked: false,
        category: 'time'
    });
    
    // Consistency achievements (much harder - more variety)
    achievements.push({
        id: 'consistent_100',
        name: 'Consistent 100',
        description: 'Throw 100m+ five times in a row',
        requiredDistance: 100,
        requiredStreak: 5,
        unlocked: false,
        category: 'consistency'
    });
    
    achievements.push({
        id: 'consistent_200',
        name: 'Consistent 200',
        description: 'Throw 200m+ five times in a row',
        requiredDistance: 200,
        requiredStreak: 5,
        unlocked: false,
        category: 'consistency'
    });
    
    achievements.push({
        id: 'consistent_500',
        name: 'Consistent 500',
        description: 'Throw 500m+ three times in a row',
        requiredDistance: 500,
        requiredStreak: 3,
        unlocked: false,
        category: 'consistency'
    });
    
    achievements.push({
        id: 'consistent_1000',
        name: 'Consistent 1000',
        description: 'Throw 1000m+ three times in a row',
        requiredDistance: 1000,
        requiredStreak: 3,
        unlocked: false,
        category: 'consistency'
    });
    
    achievements.push({
        id: 'consistent_2000',
        name: 'Consistent 2000',
        description: 'Throw 2000m+ two times in a row',
        requiredDistance: 2000,
        requiredStreak: 2,
        unlocked: false,
        category: 'consistency'
    });
    
    achievements.push({
        id: 'consistent_5000',
        name: 'Consistent 5000',
        description: 'Throw 5000m+ two times in a row',
        requiredDistance: 5000,
        requiredStreak: 2,
        unlocked: false,
        category: 'consistency'
    });
    
    achievements.push({
        id: 'consistent_10000',
        name: 'Consistent 10000',
        description: 'Throw 10000m+ two times in a row',
        requiredDistance: 10000,
        requiredStreak: 2,
        unlocked: false,
        category: 'consistency'
    });
    
    // Perfect power achievements (harder - more variety)
    achievements.push({
        id: 'perfect_power',
        name: 'Perfect Power',
        description: 'Throw 1500m+ with max power',
        requiredDistance: 1500,
        requiredPower: 0.98,
        unlocked: false,
        category: 'power'
    });
    
    achievements.push({
        id: 'precision',
        name: 'Precision Master',
        description: 'Throw 3000m with 95%+ power',
        requiredDistance: 3000,
        requiredPower: 0.95,
        unlocked: false,
        category: 'power'
    });
    
    achievements.push({
        id: 'strong_arm',
        name: 'Strong Arm',
        description: 'Throw 500m with 90%+ power',
        requiredDistance: 500,
        requiredPower: 0.90,
        unlocked: false,
        category: 'power'
    });
    
    achievements.push({
        id: 'power_hitter',
        name: 'Power Hitter',
        description: 'Throw 2000m with 92%+ power',
        requiredDistance: 2000,
        requiredPower: 0.92,
        unlocked: false,
        category: 'power'
    });
    
    achievements.push({
        id: 'max_force',
        name: 'Max Force',
        description: 'Throw 5000m with 97%+ power',
        requiredDistance: 5000,
        requiredPower: 0.97,
        unlocked: false,
        category: 'power'
    });
    
    // Milestone achievements (harder - more variety)
    achievements.push({
        id: 'first_throw',
        name: 'First Steps',
        description: 'Complete your first throw',
        requiredDistance: 1,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'getting_started',
        name: 'Getting Started',
        description: 'Throw 25 meters',
        requiredDistance: 25,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'half_century',
        name: 'Half Century',
        description: 'Throw 50 meters',
        requiredDistance: 50,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'century',
        name: 'Century',
        description: 'Throw 100 meters',
        requiredDistance: 100,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'quarter_k',
        name: 'Quarter K',
        description: 'Throw 250 meters',
        requiredDistance: 250,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'half_k',
        name: 'Half K',
        description: 'Throw 500 meters',
        requiredDistance: 500,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'millennium',
        name: 'Millennium',
        description: 'Throw 1000 meters',
        requiredDistance: 1000,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'double_k',
        name: 'Double K',
        description: 'Throw 2000 meters',
        requiredDistance: 2000,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'five_k',
        name: 'Five K',
        description: 'Throw 5000 meters',
        requiredDistance: 5000,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'ten_k',
        name: 'Ten K',
        description: 'Throw 10000 meters',
        requiredDistance: 10000,
        unlocked: false,
        category: 'milestone'
    });
    
    achievements.push({
        id: 'myriad',
        name: 'Myriad',
        description: 'Throw 10000 meters',
        requiredDistance: 10000,
        unlocked: false,
        category: 'milestone'
    });
    
    // Extreme challenges
    achievements.push({
        id: 'extreme_distance',
        name: 'Extreme Distance',
        description: 'Throw 50000 meters',
        requiredDistance: 50000,
        unlocked: false,
        category: 'extreme'
    });
    
    achievements.push({
        id: 'legendary',
        name: 'Legendary',
        description: 'Throw 100000 meters',
        requiredDistance: 100000,
        unlocked: false,
        category: 'extreme'
    });
    
    achievements.push({
        id: 'godlike',
        name: 'Godlike',
        description: 'Throw 250000 meters',
        requiredDistance: 250000,
        unlocked: false,
        category: 'extreme'
    });
    
    // Score-based achievements
    achievements.push({
        id: 'score_100',
        name: 'Century Score',
        description: 'Reach 100 total achievement points',
        requiredPoints: 100,
        unlocked: false,
        category: 'score'
    });
    
    achievements.push({
        id: 'score_250',
        name: 'Quarter Millennium',
        description: 'Reach 250 total achievement points',
        requiredPoints: 250,
        unlocked: false,
        category: 'score'
    });
    
    achievements.push({
        id: 'score_500',
        name: 'Half Millennium',
        description: 'Reach 500 total achievement points',
        requiredPoints: 500,
        unlocked: false,
        category: 'score'
    });
    
    // Combo achievements
    achievements.push({
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Unlock 10 achievements in one session',
        requiredCombo: 10,
        unlocked: false,
        category: 'combo'
    });
    
    achievements.push({
        id: 'achievement_hunter',
        name: 'Achievement Hunter',
        description: 'Unlock 25 achievements total',
        requiredTotalAchievements: 25,
        unlocked: false,
        category: 'combo'
    });
    
    achievements.push({
        id: 'completionist',
        name: 'Completionist',
        description: 'Unlock 50 achievements total',
        requiredTotalAchievements: 50,
        unlocked: false,
        category: 'combo'
    });
    
    // Special achievements
    achievements.push({
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Throw 500m in your first 5 throws',
        requiredDistance: 500,
        requiredEarlyThrows: 5,
        unlocked: false,
        category: 'special'
    });
    
    achievements.push({
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Play 100 throws in one session',
        requiredSessionThrows: 100,
        unlocked: false,
        category: 'special'
    });
    
    achievements.push({
        id: 'dedicated',
        name: 'Dedicated',
        description: 'Play 1000 throws total',
        requiredDedicatedThrows: 1000,
        unlocked: false,
        category: 'special'
    });
    
    return achievements;
}

const achievements = generateAchievements();
let totalThrows = 0;
let currentStreak = 0;
let lastThrowPower = 0;

/**
 * Check and unlock achievements based on throw results
 */
function checkAchievements(distance, time, windSpeed, power) {
    let newUnlocks = 0;
    totalThrows++;
    
    // Update streak
    if (distance >= 100) {
        currentStreak++;
    } else {
        currentStreak = 0;
    }
    
    lastThrowPower = power;
    
    achievements.forEach(achievement => {
        if (achievement.unlocked) return;
        
        let unlocked = false;
        
        switch(achievement.category) {
            case 'distance':
                unlocked = distance >= achievement.requiredDistance;
                break;
            case 'throws':
                unlocked = totalThrows >= achievement.requiredThrows;
                break;
            case 'wind':
                if (achievement.requiredWind) {
                    unlocked = distance >= achievement.requiredDistance && (windSpeed * 100) >= achievement.requiredWind;
                } else if (achievement.requiredLowWind) {
                    unlocked = distance >= achievement.requiredDistance && (windSpeed * 100) < achievement.requiredLowWind;
                }
                break;
            case 'time':
                unlocked = distance >= achievement.requiredDistance && time <= achievement.maxTime;
                break;
            case 'consistency':
                unlocked = distance >= achievement.requiredDistance && currentStreak >= achievement.requiredStreak;
                break;
            case 'power':
                unlocked = distance >= achievement.requiredDistance && power >= achievement.requiredPower;
                break;
            case 'milestone':
                unlocked = distance >= achievement.requiredDistance;
                break;
            case 'extreme':
                unlocked = distance >= achievement.requiredDistance;
                break;
            case 'score':
                unlocked = achievementPoints >= achievement.requiredPoints;
                break;
            case 'combo':
                if (achievement.requiredTotalAchievements) {
                    unlocked = unlockedAchievements.length >= achievement.requiredTotalAchievements;
                }
                break;
            case 'special':
                if (achievement.requiredEarlyThrows) {
                    unlocked = distance >= achievement.requiredDistance && totalThrows <= achievement.requiredEarlyThrows;
                } else if (achievement.requiredSessionThrows) {
                    unlocked = totalThrows >= achievement.requiredSessionThrows;
                } else if (achievement.requiredDedicatedThrows) {
                    unlocked = totalThrows >= achievement.requiredDedicatedThrows;
                }
                break;
        }
        
        if (unlocked && !unlockedAchievements.includes(achievement.id)) {
            achievement.unlocked = true;
            unlockedAchievements.push(achievement.id);
            achievementPoints++;
            newUnlocks++;
        }
    });
    
    if (newUnlocks > 0) {
        localStorage.setItem('achievementPoints', achievementPoints.toString());
        localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
        localStorage.setItem('totalThrows', totalThrows.toString());
        achievementPointsEl.textContent = achievementPoints;
    }
}

/**
 * Show achievements modal
 */
function showAchievements() {
    achievementsModal.classList.remove('hidden');
    renderAchievements();
}

/**
 * Hide achievements modal
 */
function hideAchievements() {
    achievementsModal.classList.add('hidden');
}

/**
 * Render achievements list
 */
function renderAchievements() {
    achievementsList.innerHTML = '';
    
    const unlocked = achievements.filter(a => a.unlocked).length;
    unlockedCountEl.textContent = unlocked;
    totalAchievementsEl.textContent = achievements.length;
    
    // Sort by category and unlocked status
    const sortedAchievements = [...achievements].sort((a, b) => {
        if (a.unlocked !== b.unlocked) return b.unlocked - a.unlocked;
        return a.category.localeCompare(b.category);
    });
    
    sortedAchievements.forEach(achievement => {
        const div = document.createElement('div');
        div.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        
        const icon = achievement.unlocked ? '🏆' : '🔒';
        const categoryLabel = achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1);
        
        div.innerHTML = `
            <div class="achievement-icon">${icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-category">${categoryLabel}</div>
            </div>
            <div class="achievement-status">${achievement.unlocked ? 'Unlocked' : 'Locked'}</div>
        `;
        
        achievementsList.appendChild(div);
    });
}

/**
 * Check and update scores in localStorage
 */
function checkScore(distance, time, windSpeed, power) {
    const highestScore = parseInt(localStorage.getItem('highestScore') || '0');
    const lastScore = parseInt(localStorage.getItem('lastScore') || '0');

    // Update last score
    localStorage.setItem('lastScore', distance.toString());

    // Update highest score if new record
    if (distance > highestScore) {
        localStorage.setItem('highestScore', distance.toString());
    }
    
    // Check achievements
    checkAchievements(distance, time, windSpeed, power);
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
    achievementPoints = parseInt(localStorage.getItem('achievementPoints') || '0');
    unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '[]');

    highestScoreEl.textContent = highestScore;
    lastScoreEl.textContent = lastScore;
    achievementPointsEl.textContent = achievementPoints;

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
