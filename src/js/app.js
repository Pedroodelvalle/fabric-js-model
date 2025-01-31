const FabricApp = {
    canvas: new fabric.Canvas('canvas'),
    undoStack: [],
    guides: [],
    snapThreshold: 5, // Distância para "snap"

    init() {
        console.log('FabricApp inicializado');

        // Configurações iniciais
        this.canvas.on('object:moving', this.showGuides.bind(this));
        this.canvas.on('object:modified', this.clearGuides.bind(this));
        this.canvas.on('object:added', this.saveStateAndUpdateJSON.bind(this));
        this.canvas.on('object:removed', this.saveStateAndUpdateJSON.bind(this));

        // Configurar event delegation para os controles
        document.addEventListener('click', this.handleControls.bind(this));

        // Carregar eventos de teclado
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Adicionar event listeners para uploads
        document.getElementById('imageLoader').addEventListener('change', this.handleImageUpload.bind(this));
        document.getElementById('jsonLoader').addEventListener('change', this.handleJSONUpload.bind(this));

        // Atualizar JSON inicial
        this.updateJSON();
    },

    handleControls(event) {
        const { id } = event.target;
        if (id === 'addRectangle') this.addRectangle();
        if (id === 'addCircle') this.addCircle();
        if (id === 'addText') this.addText();
        if (id === 'deleteSelected') this.deleteSelected();
        if (id === 'bringForward') this.bringForward();
        if (id === 'sendBackward') this.sendBackward();
        if (id === 'saveCanvas') this.saveCanvas();
        if (id === 'downloadJSON') this.downloadJSON();
    },

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.deleteSelected();
        } else if (event.ctrlKey && event.key === 'z') {
            this.undo();
        }
        if (event.key === 'Delete' || event.keyCode === 46) {
            this.deleteSelected();
        }
        if (event.key === 'Backspace' || event.key === 'Delete') {
            if (this.canvas.getActiveObject()) {
                event.preventDefault();
            }
            this.deleteSelected();
        }
        // Undo action when 'Command + Z' is pressed on Mac or 'Control + Z' on Windows
        if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
            event.preventDefault(); // Prevent the browser's default undo action
            this.undo();
        }
    },

    addRectangle() {
        const rect = new fabric.Rect({
            left: 50,
            top: 50,
            fill: 'red',
            width: 100,
            height: 60,
            selectable: true
        });
        this.canvas.add(rect);
        this.saveState();
        this.saveStateAndUpdateJSON();
    },

    addCircle() {
        const circle = new fabric.Circle({
            left: 100,
            top: 100,
            fill: 'blue',
            radius: 40,
            selectable: true
        });
        this.canvas.add(circle);
        this.saveState();
        this.saveStateAndUpdateJSON();
    },

    addText() {
        const text = new fabric.Textbox('Edit me!', {
            left: 150,
            top: 150,
            fontSize: 30,
            fill: 'black',
            editable: true
        });
        this.canvas.add(text);
        this.saveState();
        this.saveStateAndUpdateJSON();
    },

    deleteSelected() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.canvas.remove(activeObject);
            this.saveStateAndUpdateJSON();
        }
    },

    bringForward() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.canvas.bringForward(activeObject);
            this.saveStateAndUpdateJSON();
        }
    },

    sendBackward() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.canvas.sendBackwards(activeObject);
            this.saveStateAndUpdateJSON();
        }
    },

    changeColor() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.set('fill', document.getElementById('colorPicker').value);
            this.canvas.renderAll();
            this.saveStateAndUpdateJSON();
        }
    },

    saveCanvas() {
        const json = JSON.stringify(this.canvas);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'canvas.json';
        link.click();
    },

    downloadJSON() {
        const json = document.getElementById('jsonOutput').value;
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'canvas.json';
        link.click();
    },

    undo() {
        if (this.undoStack.length > 0) {
            const previousState = this.undoStack.pop();
            this.canvas.loadFromJSON(previousState, () => {
                this.canvas.renderAll();
                this.updateJSON();
            });
        }
    },

    saveState() {
        const currentState = JSON.stringify(this.canvas);
        this.undoStack.push(currentState);
    },

    saveStateAndUpdateJSON() {
        this.saveState();
        this.updateJSON();
    },

    updateJSON() {
        const json = JSON.stringify(this.canvas, null, 2); // Indenta com 2 espaços para melhor legibilidade
        document.getElementById('jsonOutput').value = json;
    },

    handleImageUpload(event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();

            fabric.Image.fromURL(e.target.result, function(oImg) {
                // Log the Fabric image object to the console to verify it's correct
                console.log('Fabric image object:', oImg);

                // Scale the image down to fit the canvas if it's too large
                var scale = Math.min(this.canvas.width / oImg.width, this.canvas.height / oImg.height);
                if (scale < 1) {
                    oImg.scale(scale);
                }
                this.canvas.add(oImg); // Add the image to the canvas
                this.saveStateAndUpdateJSON();
            }.bind(this), {
                // Set crossOrigin to 'anonymous' if loading images from an external source
                crossOrigin: 'anonymous'
            });
        };

            reader.onerror = function(e) {
                console.error('Error reading file:', e);
            };

        reader.readAsDataURL(file);
    },

    handleJSONUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (f) => {
            try {
                const json = JSON.parse(f.target.result);
    
                FabricApp.canvas.loadFromJSON(json, () => {
                    FabricApp.canvas.renderAll();
    
                    // 1. Obtém as Dimensões Originais do JSON
                    const jsonCanvasWidth = json.width || FabricApp.canvas.getWidth(); 
                    const jsonCanvasHeight = json.height || FabricApp.canvas.getHeight();
    
                    // 2. Obtém as Dimensões do Canvas Atual
                    const newCanvasWidth = FabricApp.canvas.getWidth();
                    const newCanvasHeight = FabricApp.canvas.getHeight();
    
                    // 3. Calcula a Escala para Ajustar o JSON ao Novo Canvas
                    const scaleX = newCanvasWidth / jsonCanvasWidth;
                    const scaleY = newCanvasHeight / jsonCanvasHeight;
    
                    // Usa o menor fator para manter a proporção sem distorções
                    const scaleFactor = Math.min(scaleX, scaleY);
    
                    // 4. Redimensiona e Reposiciona os Objetos
                    FabricApp.canvas.getObjects().forEach(obj => {
                        obj.scaleX *= scaleFactor;
                        obj.scaleY *= scaleFactor;
                        obj.left *= scaleFactor;
                        obj.top *= scaleFactor;
                        obj.setCoords(); // Atualiza as coordenadas do objeto
                    });
    
                    // 5. Recalcula a Transformação da Viewport para Centralizar
                    const offsetX = (newCanvasWidth - jsonCanvasWidth * scaleFactor) / 2;
                    const offsetY = (newCanvasHeight - jsonCanvasHeight * scaleFactor) / 2;
                    
                    FabricApp.canvas.setViewportTransform([1, 0, 0, 1, offsetX, offsetY]);
                    FabricApp.canvas.renderAll();
                });
    
            } catch (error) {
                alert('Error loading JSON. Ensure the file is valid.');
                console.error('JSON Load Error:', error);
            }
        };
        reader.readAsText(file);
    },    
    

    // Métodos para Alignment Guides
    showGuides(event) {
        this.clearGuides(); // Remove guias anteriores

        const movingObject = event.target;
        const objects = this.canvas.getObjects().filter(obj => obj !== movingObject);

        const canvasCenterX = this.canvas.width / 2;
        const canvasCenterY = this.canvas.height / 2;

        const objCenterX = movingObject.left + (movingObject.width * movingObject.scaleX) / 2;
        const objCenterY = movingObject.top + (movingObject.height * movingObject.scaleY) / 2;

        let addedGuides = false;

        // 🔹 Alinhamento com o Centro do Canvas
        if (Math.abs(objCenterX - canvasCenterX) < this.snapThreshold) {
            this.addGuideLine(canvasCenterX, 0, canvasCenterX, this.canvas.height);
            movingObject.set({ left: canvasCenterX - (movingObject.width * movingObject.scaleX) / 2 });
            addedGuides = true;
        }
        if (Math.abs(objCenterY - canvasCenterY) < this.snapThreshold) {
            this.addGuideLine(0, canvasCenterY, this.canvas.width, canvasCenterY);
            movingObject.set({ top: canvasCenterY - (movingObject.height * movingObject.scaleY) / 2 });
            addedGuides = true;
        }

        // 🔹 Alinhamento com Outros Objetos
        objects.forEach(obj => {
            const objCenterXOther = obj.left + (obj.width * obj.scaleX) / 2;
            const objCenterYOther = obj.top + (obj.height * obj.scaleY) / 2;

            // Alinhamento horizontal (centros)
            if (Math.abs(objCenterX - objCenterXOther) < this.snapThreshold) {
                this.addGuideLine(objCenterXOther, 0, objCenterXOther, this.canvas.height);
                movingObject.set({ left: objCenterXOther - (movingObject.width * movingObject.scaleX) / 2 });
                addedGuides = true;
            }

            // Alinhamento vertical (centros)
            if (Math.abs(objCenterY - objCenterYOther) < this.snapThreshold) {
                this.addGuideLine(0, objCenterYOther, this.canvas.width, objCenterYOther);
                movingObject.set({ top: objCenterYOther - (movingObject.height * movingObject.scaleY) / 2 });
                addedGuides = true;
            }

            // Alinhamento com bordas (esquerda)
            if (Math.abs(movingObject.left - obj.left) < this.snapThreshold) {
                this.addGuideLine(obj.left, 0, obj.left, this.canvas.height);
                movingObject.set({ left: obj.left });
                addedGuides = true;
            }

            // Alinhamento com bordas (topo)
            if (Math.abs(movingObject.top - obj.top) < this.snapThreshold) {
                this.addGuideLine(0, obj.top, this.canvas.width, obj.top);
                movingObject.set({ top: obj.top });
                addedGuides = true;
            }

            // Você pode adicionar mais verificações de alinhamento conforme necessário
        });

        if (addedGuides) {
            this.canvas.renderAll();
        }
    },

    addGuideLine(x1, y1, x2, y2) {
        const line = new fabric.Line([x1, y1, x2, y2], {
            stroke: 'red',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            hasControls: false,
            hasBorders: false
        });
        this.guides.push(line);
        this.canvas.add(line);
    },

    clearGuides() {
        this.guides.forEach(line => this.canvas.remove(line));
        this.guides = [];
        this.canvas.renderAll();
    }
};

// Inicializar FabricApp quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => FabricApp.init());
