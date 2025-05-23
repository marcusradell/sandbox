class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 30;
        this.color = [1.0, 0.41, 0.71, 1.0]; // Rosa färg (RGBA)
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpForce = -15;
        this.gravity = 0.8;
        this.isJumping = false;
        this.isDucking = false;
        this.groundLevel = 500; // Y-position för marken
    }
    
    update() {
        // Applicera gravitation
        this.velocityY += this.gravity;
        
        // Uppdatera position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Kontrollera kollision med marken
        if (this.y + this.radius > this.groundLevel) {
            this.y = this.groundLevel - this.radius;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        // Begränsa spelaren inom skärmen
        if (this.x - this.radius < 0) {
            this.x = this.radius;
        }
        if (this.x + this.radius > 800) {
            this.x = 800 - this.radius;
        }
    }
    
    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
            this.isDucking = false;
        }
    }
    
    duck() {
        if (!this.isJumping) {
            this.isDucking = true;
        }
    }
    
    stopDucking() {
        this.isDucking = false;
    }
    
    moveLeft() {
        this.velocityX = -this.speed;
    }
    
    moveRight() {
        this.velocityX = this.speed;
    }
    
    stopMoving() {
        this.velocityX = 0;
    }
    
    draw(renderer) {
        renderer.drawCircle(
            this.x, 
            this.y, 
            this.radius, 
            this.color,
            this.isDucking
        );
        
        // Rita ögon
        const eyeRadius = this.radius * 0.2;
        const eyeOffset = this.radius * 0.4;
        const eyeY = this.y - this.radius * 0.1;
        
        // Vänster öga
        renderer.drawCircle(
            this.x - eyeOffset, 
            eyeY, 
            eyeRadius, 
            [0, 0, 0, 1.0]
        );
        
        // Höger öga
        renderer.drawCircle(
            this.x + eyeOffset, 
            eyeY, 
            eyeRadius, 
            [0, 0, 0, 1.0]
        );
        
        // Rita mun
        if (!this.isDucking) {
            // Normal glad mun
            const mouthY = this.y + this.radius * 0.3;
            const mouthWidth = this.radius * 0.6;
            
            // Använd en liten cirkel för att representera munnen
            renderer.drawCircle(
                this.x, 
                mouthY, 
                this.radius * 0.15, 
                [0, 0, 0, 1.0]
            );
        } else {
            // Förvånad mun när ducking
            const mouthY = this.y + this.radius * 0.4;
            
            renderer.drawCircle(
                this.x, 
                mouthY, 
                this.radius * 0.1, 
                [0, 0, 0, 1.0]
            );
        }
    }
}
