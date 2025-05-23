class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl');
        
        if (!this.gl) {
            alert('WebGL stöds inte av din webbläsare!');
            return;
        }
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.initShaders();
        this.initBuffers();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    initShaders() {
        // Vertex shader program
        const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;
            
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            
            varying lowp vec4 vColor;
            
            void main(void) {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vColor = aVertexColor;
            }
        `;
        
        // Fragment shader program
        const fsSource = `
            varying lowp vec4 vColor;
            
            void main(void) {
                gl_FragColor = vColor;
            }
        `;
        
        // Skapa shader program
        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);
        
        this.shaderProgram = this.gl.createProgram();
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);
        
        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            alert('Kunde inte initiera shader program: ' + this.gl.getProgramInfoLog(this.shaderProgram));
            return;
        }
        
        this.programInfo = {
            program: this.shaderProgram,
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
                vertexColor: this.gl.getAttribLocation(this.shaderProgram, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
            },
        };
    }
    
    loadShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            alert('Ett fel inträffade vid kompilering av shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    initBuffers() {
        // Skapa buffert för cirkelns position
        this.positionBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
    }
    
    drawCircle(x, y, radius, color, isDucking = false) {
        const gl = this.gl;
        const numSegments = 30;
        const vertices = [];
        const colors = [];
        
        // Lägg till centrum
        vertices.push(x, y, 0);
        
        // Lägg till färg för centrum
        colors.push(color[0], color[1], color[2], color[3]);
        
        // Skapa cirkelns punkter
        for (let i = 0; i <= numSegments; i++) {
            const theta = (i / numSegments) * Math.PI * 2;
            
            // Om ducking, skapa en mer tillplattad cirkel
            const verticalScale = isDucking ? 0.5 : 1.0;
            
            const px = x + radius * Math.cos(theta);
            const py = y + radius * verticalScale * Math.sin(theta);
            
            vertices.push(px, py, 0);
            colors.push(color[0], color[1], color[2], color[3]);
        }
        
        // Bind position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        // Bind color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        
        // Använd shader program
        gl.useProgram(this.programInfo.program);
        
        // Skapa projektionsmatris
        const projectionMatrix = mat4.create();
        mat4.ortho(projectionMatrix, 0, this.canvas.width, this.canvas.height, 0, -1.0, 1.0);
        
        // Skapa modelViewMatrix
        const modelViewMatrix = mat4.create();
        
        // Sätt uniforms
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);
        
        // Sätt vertex position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexPosition,
            3,          // 3 komponenter per vertex
            gl.FLOAT,   // data är 32bit floats
            false,      // ingen normalisering
            0,          // ingen stride
            0           // ingen offset
        );
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
        
        // Sätt vertex color attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(
            this.programInfo.attribLocations.vertexColor,
            4,          // 4 komponenter per färg (RGBA)
            gl.FLOAT,   // data är 32bit floats
            false,      // ingen normalisering
            0,          // ingen stride
            0           // ingen offset
        );
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);
        
        // Rita trianglar
        gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments + 2);
    }
    
    clear() {
        this.gl.clearColor(0.53, 0.81, 0.92, 1.0);  // Ljusblå himmel
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
}

// Polyfill för mat4 om det inte finns
const mat4 = {
    create: function() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },
    
    ortho: function(out, left, right, bottom, top, near, far) {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);
        
        out[0] = -2 * lr;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = -2 * bt;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = 2 * nf;
        out[11] = 0;
        out[12] = (left + right) * lr;
        out[13] = (top + bottom) * bt;
        out[14] = (far + near) * nf;
        out[15] = 1;
        
        return out;
    }
};
