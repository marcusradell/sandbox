// Vänta tills DOM är laddad
document.addEventListener('DOMContentLoaded', () => {
    // Initiera spelet
    const game = new Game('game-canvas');
    game.start();
});

class Game {
    constructor(canvasId) {
        this.renderer = new Renderer(canvasId);
        this.worldWidth = 800;
        this.worldHeight = 600;
        this.player = new Player(50, 300);
        this.keys = {};
        this.touchControls = {
            left: false,
            right: false,
            jump: false,
            duck: false
        };
        this.isMobile = this.detectMobile();
        this.camera = {
            x: 0,
            y: 0,
            width: this.renderer.canvas.width,
            height: this.renderer.canvas.height
        };
        this.platforms = [
            { x: 0, y: 550, width: 800, height: 50 }, // Marken
            { x: 150, y: 450, width: 100, height: 20 },
            { x: 320, y: 380, width: 100, height: 20 },
            { x: 500, y: 320, width: 100, height: 20 },
            { x: 650, y: 250, width: 100, height: 20 }
        ];
        
        // Mål position
        this.goal = { x: 700, y: 200, width: 50, height: 50 };
        this.goalReached = false;
        this.celebrationTimer = 0;
        this.celebrationDuration = 3000; // 3 sekunder
        
        // Lägg till event listeners för tangentbord
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Lägg till touch event listeners om det är en mobil enhet
        if (this.isMobile) {
            this.setupTouchControls();
        }
        
        // Hantera fönsterändring
        window.addEventListener('resize', () => {
            this.renderer.resizeCanvas();
            this.updateViewport();
            this.isMobile = this.detectMobile();
            this.updateTouchControlsVisibility();
        });
        
        // Initiera viewport
        this.updateViewport();
    }
    
    start() {
        // Starta game loop
        this.lastTime = 0;
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    gameLoop(timestamp) {
        // Beräkna delta tid
        const deltaTime = timestamp - (this.lastTime || timestamp);
        this.lastTime = timestamp;
        
        // Uppdatera
        this.update(deltaTime);
        
        // Rendera
        this.render();
        
        // Fortsätt loopen
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    update(deltaTime) {
        // Hantera spelarens input om målet inte är nått
        if (!this.goalReached) {
            this.handleInput();
        } else {
            // Uppdatera celebrationTimer
            this.celebrationTimer += deltaTime;
            
            // Gör en glad dans
            this.player.celebrate(this.celebrationTimer);
            
            // Återställ spelet efter celebrationDuration
            if (this.celebrationTimer >= this.celebrationDuration) {
                this.resetGame();
            }
        }
        
        // Uppdatera spelaren
        this.player.update();
        
        // Kontrollera kollision med plattformar
        this.checkPlatformCollisions();
        
        // Kontrollera om spelaren nått målet
        if (!this.goalReached && this.checkGoalCollision()) {
            this.goalReached = true;
            this.celebrationTimer = 0;
        }
        
        // Uppdatera kameran för att följa spelaren
        this.updateCamera();
    }
    
    resetGame() {
        this.player = new Player(50, 300);
        this.goalReached = false;
        this.celebrationTimer = 0;
    }
    
    checkPlatformCollisions() {
        // Återställ spelarens markflagga
        this.player.isOnGround = false;
        
        for (const platform of this.platforms) {
            // Kontrollera om spelaren är ovanför plattformen
            if (this.player.velocityY >= 0 && 
                this.player.x + this.player.radius > platform.x && 
                this.player.x - this.player.radius < platform.x + platform.width &&
                this.player.y + this.player.radius > platform.y &&
                this.player.y + this.player.radius < platform.y + 10) {
                
                this.player.y = platform.y - this.player.radius;
                this.player.velocityY = 0;
                this.player.isJumping = false;
                this.player.isOnGround = true;
                break;
            }
        }
    }
    
    checkGoalCollision() {
        // Kontrollera om spelaren rör vid målet
        return (this.player.x + this.player.radius > this.goal.x &&
                this.player.x - this.player.radius < this.goal.x + this.goal.width &&
                this.player.y + this.player.radius > this.goal.y &&
                this.player.y - this.player.radius < this.goal.y + this.goal.height);
    }
    
    handleInput() {
        // Rörelse vänster/höger
        if (this.keys['ArrowLeft'] || this.touchControls.left) {
            this.player.moveLeft();
        } else if (this.keys['ArrowRight'] || this.touchControls.right) {
            this.player.moveRight();
        } else {
            this.player.stopMoving();
        }
        
        // Hoppa
        if (this.keys[' '] || this.touchControls.jump) {
            this.player.jump();
        }
        
        // Ducka
        if (this.keys['ArrowDown'] || this.touchControls.duck) {
            this.player.duck();
        } else {
            this.player.stopDucking();
        }
    }
    
    render() {
        // Rensa canvas
        this.renderer.clear();
        
        // Rita plattformar
        this.drawPlatforms();
        
        // Rita målet
        this.drawGoal();
        
        // Rita spelaren
        this.player.draw(this.renderer, this.camera);
    }
    
    drawGoal() {
        const gl = this.renderer.gl;
        
        // Använd en gul färg för målet
        const goalColor = [1.0, 1.0, 0.0, 1.0];
        
        // Beräkna skalfaktorer för att konvertera från världskoordinater till skärmkoordinater
        const scaleX = this.camera.width / this.camera.viewWidth;
        const scaleY = this.camera.height / this.camera.viewHeight;
        
        // Rita en rektangel för målet med kameraoffset och skalning
        const x = (this.goal.x - this.camera.x) * scaleX;
        const y = (this.goal.y - this.camera.y) * scaleY;
        const width = this.goal.width * scaleX;
        const height = this.goal.height * scaleY;
        
        // Rita en rektangel för målet
        const vertices = [
            x, y, 0,
            x + width, y, 0,
            x + width, y + height, 0,
            
            x, y, 0,
            x + width, y + height, 0,
            x, y + height, 0
        ];
        
        const colors = [];
        for (let i = 0; i < 6; i++) {
            colors.push(...goalColor);
        }
        
        // Bind position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        // Bind color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        
        // Använd shader program
        gl.useProgram(this.renderer.programInfo.program);
        
        // Skapa projektionsmatris
        const projectionMatrix = mat4.create();
        mat4.ortho(projectionMatrix, 0, this.renderer.canvas.width, this.renderer.canvas.height, 0, -1.0, 1.0);
        
        // Skapa modelViewMatrix
        const modelViewMatrix = mat4.create();
        
        // Sätt uniforms
        gl.uniformMatrix4fv(
            this.renderer.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            this.renderer.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);
        
        // Sätt vertex position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.positionBuffer);
        gl.vertexAttribPointer(
            this.renderer.programInfo.attribLocations.vertexPosition,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(this.renderer.programInfo.attribLocations.vertexPosition);
        
        // Sätt vertex color attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.colorBuffer);
        gl.vertexAttribPointer(
            this.renderer.programInfo.attribLocations.vertexColor,
            4,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(this.renderer.programInfo.attribLocations.vertexColor);
        
        // Rita trianglar
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    drawPlatforms() {
        const gl = this.renderer.gl;
        
        // Använd en grön färg för marken och en brun för plattformar
        const groundColor = [0.4, 0.8, 0.2, 1.0];
        const platformColor = [0.6, 0.4, 0.2, 1.0];
        
        // Beräkna skalfaktorer för att konvertera från världskoordinater till skärmkoordinater
        const scaleX = this.camera.width / this.camera.viewWidth;
        const scaleY = this.camera.height / this.camera.viewHeight;
        
        // Rita alla plattformar
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            const color = i === 0 ? groundColor : platformColor;
            
            // Applicera kameraoffset och skalning
            const x = (platform.x - this.camera.x) * scaleX;
            const y = (platform.y - this.camera.y) * scaleY;
            const width = platform.width * scaleX;
            const height = platform.height * scaleY;
            
            // Skapa en rektangel med två trianglar
            const vertices = [
                x, y, 0,
                x + width, y, 0,
                x + width, y + height, 0,
                
                x, y, 0,
                x + width, y + height, 0,
                x, y + height, 0
            ];
            
            const colors = [];
            for (let j = 0; j < 6; j++) {
                colors.push(...color);
            }
            
            // Bind position buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        // Bind color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        
        // Använd shader program
        gl.useProgram(this.renderer.programInfo.program);
        
        // Skapa projektionsmatris
        const projectionMatrix = mat4.create();
        mat4.ortho(projectionMatrix, 0, this.renderer.canvas.width, this.renderer.canvas.height, 0, -1.0, 1.0);
        
        // Skapa modelViewMatrix
        const modelViewMatrix = mat4.create();
        
        // Sätt uniforms
        gl.uniformMatrix4fv(
            this.renderer.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            this.renderer.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);
        
        // Sätt vertex position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.positionBuffer);
        gl.vertexAttribPointer(
            this.renderer.programInfo.attribLocations.vertexPosition,
            3,          // 3 komponenter per vertex
            gl.FLOAT,   // data är 32bit floats
            false,      // ingen normalisering
            0,          // ingen stride
            0           // ingen offset
        );
        gl.enableVertexAttribArray(this.renderer.programInfo.attribLocations.vertexPosition);
        
            // Sätt vertex color attribute
            gl.bindBuffer(gl.ARRAY_BUFFER, this.renderer.colorBuffer);
            gl.vertexAttribPointer(
                this.renderer.programInfo.attribLocations.vertexColor,
                4,          // 4 komponenter per färg (RGBA)
                gl.FLOAT,   // data är 32bit floats
                false,      // ingen normalisering
                0,          // ingen stride
                0           // ingen offset
            );
            gl.enableVertexAttribArray(this.renderer.programInfo.attribLocations.vertexColor);
            
            // Rita trianglar
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }
    
    handleKeyDown(e) {
        this.keys[e.key] = true;
    }
    
    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
    
    detectMobile() {
        return (
            navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i) ||
            (window.innerWidth <= 800)
        );
    }
    
    updateTouchControlsVisibility() {
        // Always show controls regardless of device detection
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'flex';
        }
    }
    
    updateViewport() {
        // Uppdatera kamerans dimensioner baserat på canvas storlek
        this.camera.width = this.renderer.canvas.width;
        this.camera.height = this.renderer.canvas.height;
        
        // Beräkna skala baserat på aspektförhållande
        const worldAspect = this.worldWidth / this.worldHeight;
        const screenAspect = this.camera.width / this.camera.height;
        
        // Justera kamerans synfält baserat på aspektförhållande
        if (screenAspect > worldAspect) {
            // Bredare skärm än världen
            this.camera.viewWidth = this.worldHeight * screenAspect;
            this.camera.viewHeight = this.worldHeight;
        } else {
            // Högre skärm än världen
            this.camera.viewWidth = this.worldWidth;
            this.camera.viewHeight = this.worldWidth / screenAspect;
        }
    }
    
    updateCamera() {
        // Beräkna önskad kameraposition (centrerad på spelaren)
        const targetX = this.player.x - this.camera.viewWidth / 2;
        const targetY = this.player.y - this.camera.viewHeight / 2;
        
        // Mjuk kamerarörelse (lerp)
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // Begränsa kameran så att den inte visar utanför spelvärlden
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth - this.camera.viewWidth));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight - this.camera.viewHeight));
    }
    
    setupTouchControls() {
        // Visa mobila kontroller
        this.updateTouchControlsVisibility();
        
        // Konfigurera touch-knappar
        const leftBtn = document.getElementById('btn-left');
        const rightBtn = document.getElementById('btn-right');
        const jumpBtn = document.getElementById('btn-jump');
        const duckBtn = document.getElementById('btn-duck');
        
        // Vänster knapp
        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.left = true;
        });
        leftBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.left = false;
        });
        
        // Höger knapp
        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.right = true;
        });
        rightBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.right = false;
        });
        
        // Hopp knapp
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.jump = true;
        });
        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.jump = false;
        });
        
        // Duck knapp
        duckBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchControls.duck = true;
        });
        duckBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchControls.duck = false;
        });
        
        // Förhindra att canvas-element scrollar sidan på touch
        this.renderer.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.renderer.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }
}
