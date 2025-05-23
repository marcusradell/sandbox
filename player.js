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
        this.isOnGround = false;
        this.isCelebrating = false;
        this.celebrationPhase = 0;
    }
    
    update() {
        // Applicera gravitation om inte på marken
        if (!this.isOnGround) {
            this.velocityY += this.gravity;
        }
        
        // Uppdatera position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Begränsa spelaren inom skärmen
        if (this.x - this.radius < 0) {
            this.x = this.radius;
        }
        if (this.x + this.radius > 800) {
            this.x = 800 - this.radius;
        }
    }
    
    celebrate(timer) {
        this.isCelebrating = true;
        
        // Skapa en glad dans genom att ändra position och storlek baserat på timer
        this.celebrationPhase = Math.floor(timer / 200) % 4;
        
        // Hoppa upp och ner
        if (this.celebrationPhase === 0) {
            this.y -= 2;
        } else if (this.celebrationPhase === 2) {
            this.y += 2;
        }
        
        // Stoppa all rörelse under firandet
        this.velocityX = 0;
        this.velocityY = 0;
    }
    
    jump() {
        if (this.isOnGround && !this.isJumping) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
            this.isDucking = false;
            this.isOnGround = false;
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
        // Ändra färg om firande
        const color = this.isCelebrating ? 
            [1.0, 0.41 + Math.sin(this.celebrationPhase) * 0.2, 0.71, 1.0] : 
            this.color;
        
        // Ändra storlek om firande
        const radiusModifier = this.isCelebrating ? 
            1.0 + Math.sin(this.celebrationPhase * 2) * 0.1 : 
            1.0;
        
        renderer.drawCircle(
            this.x, 
            this.y, 
            this.radius * radiusModifier, 
            color,
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
        if (this.isCelebrating) {
            // Extra glad mun när firande
            const mouthY = this.y + this.radius * 0.3;
            
            // Större mun när firande
            renderer.drawCircle(
                this.x, 
                mouthY, 
                this.radius * 0.25, 
                [0, 0, 0, 1.0]
            );
        } else if (!this.isDucking) {
            // Normal glad mun
            const mouthY = this.y + this.radius * 0.3;
            
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
