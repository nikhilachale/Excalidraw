import { Tool } from "@/app/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
    color?: string;
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color?: string;
}

export class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[]
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private selectedTool: Tool = "circle";
    private strokeColor: string = "#3B82F6";
    private undoHistory: Shape[][] = [];
    private animationFrameId: number | null = null;
    private previewX = 0;
    private previewY = 0;

    socket: WebSocket | null;
    private sendMessage?: (message: string) => void;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket | null, sendMessage?: (message: string) => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.sendMessage = sendMessage;
        this.clicked = false;
        this.init();
        this.initHandlers();
        this.initMouseHandlers();
    }
    
    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler)

        this.canvas.removeEventListener("mouseup", this.mouseUpHandler)

        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler)

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    setTool(tool: "circle" | "line" | "rect") {
        this.selectedTool = tool;
    }

    setStrokeColor(color: string) {
        this.strokeColor = color;
    }

    clearShapes() {
        if (this.existingShapes.length === 0) {
            return;
        }

        this.saveToHistory();
        this.existingShapes = [];
        this.clearCanvas();
    }

    undo() {
        if (this.undoHistory.length > 0) {
            this.existingShapes = this.undoHistory.pop() || [];
            this.clearCanvas();
            // Send undo state to other users
            const message = JSON.stringify({
                type: "undo",
                shapes: this.existingShapes,
                roomId: this.roomId
            });
            if (this.sendMessage) {
                this.sendMessage(message);
            } else if (this.socket) {
                this.socket.send(message);
            }
        }
    }

    saveToHistory() {
        // Keep only last 20 states to prevent memory issues
        if (this.undoHistory.length >= 20) {
            this.undoHistory.shift();
        }
        this.undoHistory.push([...this.existingShapes]);
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();
    }

    initHandlers() {
        if (!this.socket) {
            return;
        }

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message)
                this.existingShapes.push(parsedShape.shape)
                this.clearCanvas();
            } else if (message.type === "clear") {
                // Handle clear message from websocket
                this.existingShapes = [];
                this.clearCanvas();
            } else if (message.type === "undo") {
                // Handle undo message from other users
                this.existingShapes = message.shapes || [];
                this.clearCanvas();
            }
        }
    }

    private drawShape(shape: Shape) {
        this.ctx.strokeStyle = shape.color || this.strokeColor;

        if (shape.type === "rect") {
            this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            return;
        }

        if (shape.type === "circle") {
            this.ctx.beginPath();
            this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    private renderScene(previewX?: number, previewY?: number) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "black"
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineWidth = 2;

        for (const shape of this.existingShapes) {
            this.drawShape(shape);
        }

        if (!this.clicked || previewX === undefined || previewY === undefined) {
            return;
        }

        const width = previewX - this.startX;
        const height = previewY - this.startY;
        const selectedTool = this.selectedTool;
        this.ctx.strokeStyle = this.strokeColor;

        if (selectedTool === "rect") {
            this.ctx.strokeRect(this.startX, this.startY, width, height);
            return;
        }

        if (selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            const centerX = this.startX + width / 2;
            const centerY = this.startY + height / 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(previewX, previewY);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    clearCanvas() {
        this.renderScene();
    }

    private schedulePreviewRender() {
        if (this.animationFrameId !== null) {
            return;
        }

        this.animationFrameId = requestAnimationFrame(() => {
            this.animationFrameId = null;

            if (this.clicked) {
                this.renderScene(this.previewX, this.previewY);
                return;
            }

            this.renderScene();
        });
    }

    mouseDownHandler = (e: MouseEvent) => {
        this.clicked = true
        const rect = this.canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left
        this.startY = e.clientY - rect.top
        this.previewX = this.startX;
        this.previewY = this.startY;
    }
    mouseUpHandler = (e: MouseEvent) => {
        this.clicked = false
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const width = currentX - this.startX;
        const height = currentY - this.startY;

        // Save current state to history before adding new shape
        this.saveToHistory();

        const selectedTool = this.selectedTool;
        let shape: Shape | null = null;
        if (selectedTool === "rect") {

            shape = {
                type: "rect",
                x: this.startX,
                y: this.startY,
                height,
                width,
                color: this.strokeColor
            }
        } else if (selectedTool === "circle") {
            const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
            shape = {
                type: "circle",
                radius: radius,
                centerX: this.startX + width / 2,
                centerY: this.startY + height / 2,
                color: this.strokeColor
            }
        }
        else if (selectedTool === "line") {
      shape = {
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX: currentX,
        endY: currentY,
        color: this.strokeColor
      }
    }

        if (!shape) {
            return;
        }

        this.existingShapes.push(shape);
        this.clearCanvas();

        const message = JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                shape
            }),
            roomId: this.roomId
        });
        if (this.sendMessage) {
            this.sendMessage(message);
        } else if (this.socket) {
            this.socket.send(message);
        }
    }
    mouseMoveHandler = (e: MouseEvent) => {
        if (this.clicked) {
            const rect = this.canvas.getBoundingClientRect();
            this.previewX = e.clientX - rect.left;
            this.previewY = e.clientY - rect.top;
            this.schedulePreviewRender();
        }
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler)

        this.canvas.addEventListener("mouseup", this.mouseUpHandler)

        this.canvas.addEventListener("mousemove", this.mouseMoveHandler)    

    }
}