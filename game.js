// Vänta tills DOM är laddad
document.addEventListener('DOMContentLoaded', () => {
    // Initiera spelet
    const game = new Game('game-canvas');
    game.start();
});

class Game {
    constructor(canvasId) {
        this.renderer = new Renderer(canvasId);
        this.player = new Player(400, 300);
        this.keys = {};
        this.platforms = [
            { x: 0, y: 550, width: 800, height: 50 } // Marken
        ];
        
        // Lägg till event listeners för tangentbord
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
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
        // Hantera spelarens input
        this.handleInput();
        
        // Uppdatera spelaren
        this.player.update();
    }
    
    handleInput() {
        // Rörelse vänster/höger
        if (this.keys['ArrowLeft']) {
            this.player.moveLeft();
        } else if (this.keys['ArrowRight']) {
            this.player.moveRight();
        } else {
            this.player.stopMoving();
        }
        
        // Hoppa
        if (this.keys[' ']) {
            this.player.jump();
        }
        
        // Ducka
        if (this.keys['ArrowDown']) {
            this.player.duck();
        } else {
            this.player.stopDucking();
        }
    }
    
    render() {
        // Rensa canvas
        this.renderer.clear();
        
        // Rita marken
        this.drawPlatforms();
        
        // Rita spelaren
        this.player.draw(this.renderer);
    }
    
    drawPlatforms() {
        // Skapa en enkel markyta
        const gl = this.renderer.gl;
        
        // Använd en grön färg för marken
        const groundColor = [0.4, 0.8, 0.2, 1.0];
        
        // Rita en rektangel för marken
        const groundY = this.platforms[0].y;
        const groundHeight = this.platforms[0].height;
        const groundWidth = this.platforms[0].width;
        
        // Skapa en rektangel med två trianglar
        const vertices = [
            0, groundY, 0,
            groundWidth, groundY, 0,
            groundWidth, groundY + groundHeight, 0,
            
            0, groundY, 0,
            groundWidth, groundY + groundHeight, 0,
            0, groundY + groundHeight, 0
        ];
        
        const colors = [];
        for (let i = 0; i < 6; i++) {
            colors.push(...groundColor);
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
    
    handleKeyDown(e) {
        this.keys[e.key] = true;
    }
    
    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
}
