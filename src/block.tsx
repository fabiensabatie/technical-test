import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useCollabSpace } from "@mexty/realtime";

// ===== Type Definitions =====
interface Point {
  x: number;
  y: number;
}

interface DrawingStroke {
  id: string;
  userId: string;
  points: Point[];
  color: string;
  size: number;
  timestamp: number;
}

interface UserCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
}

interface CollaborativeState {
  strokes: DrawingStroke[];
  cursors: Record<string, UserCursor>;
  canvasData?: string;
}

interface BlockProps {
  canvasWidth?: number;
  canvasHeight?: number;
  brushSize?: number;
  brushColor?: string;
  backgroundColor?: string;
  enableEraser?: boolean;
  maxStrokes?: number;
  showCursors?: boolean;
  documentId?: string;
}

interface ToolbarProps {
  currentTool: "brush" | "eraser";
  setCurrentTool: (tool: "brush" | "eraser") => void;
  enableEraser: boolean;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  currentSize: number;
  setCurrentSize: (size: number) => void;
  clearCanvas: () => void;
  isConnected: boolean;
  strokeCount: number;
  maxStrokes: number;
  activeUsers: number;
}

interface UserCursorProps {
  cursor: UserCursor;
  userId: string;
}

// ===== Constants =====
const BRUSH_COLORS = [
  "#000000", // Black
  "#ff0000", // Red
  "#00ff00", // Green
  "#0000ff", // Blue
  "#ffff00", // Yellow
  "#ff00ff", // Magenta
  "#00ffff", // Cyan
  "#ff8000", // Orange
  "#8000ff", // Purple
  "#ff0080", // Pink
] as const;

const RENDERING_CONFIG = {
  TARGET_FPS: 60,
  FRAME_TIME_MS: 16.67, // 1000ms / 60fps
  CURSOR_UPDATE_INTERVAL_DRAWING: 33, // 30fps when drawing
  CURSOR_UPDATE_INTERVAL_IDLE: 100, // 10fps when idle
  CURSOR_TIMEOUT_MS: 5000,
  STROKE_PRUNING_PERCENTAGE: 0.1,
} as const;

// ===== Utility Functions =====
const generateStrokeId = (userId: string): string =>
  `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const calculateDistance = (p1: Point, p2: Point): number =>
  Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

const getMinDrawDistance = (brushSize: number): number =>
  Math.max(1, brushSize * 0.3);

// ===== Components =====

// Optimized cursor component
const UserCursor = memo<UserCursorProps>(({ cursor, userId }) => (
  <div
    className="absolute pointer-events-none user-cursor"
    style={{
      left: cursor.x,
      top: cursor.y,
      transform: "translate(-50%, -50%)",
      zIndex: 10,
    }}
  >
    <div
      className="w-3 h-3 rounded-full border-2 border-white"
      style={{ backgroundColor: cursor.color }}
    />
    <div className="text-xs mt-1 px-1 bg-black text-white rounded whitespace-nowrap text-[10px]">
      User {userId.slice(-4)}
    </div>
  </div>
));

UserCursor.displayName = "UserCursor";

// Optimized toolbar component
const DrawingToolbar = memo<ToolbarProps>(
  ({
    currentTool,
    setCurrentTool,
    enableEraser,
    currentColor,
    setCurrentColor,
    currentSize,
    setCurrentSize,
    clearCanvas,
    isConnected,
    strokeCount,
    maxStrokes,
    activeUsers,
  }) => (
    <div className="flex items-center gap-2 p-3 border-b toolbar bg-gray-50 border-gray-300">
      {/* Tool Selection */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentTool("brush")}
          className={`toolbar-button px-3 py-1 rounded text-sm transition-all ${
            currentTool === "brush"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          aria-label="Select brush tool"
        >
          🖌️ Brush
        </button>
        {enableEraser && (
          <button
            onClick={() => setCurrentTool("eraser")}
            className={`toolbar-button px-3 py-1 rounded text-sm transition-all ${
              currentTool === "eraser"
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            aria-label="Select eraser tool"
          >
            🧹 Eraser
          </button>
        )}
      </div>

      {/* Color Palette */}
      {currentTool === "brush" && (
        <div
          className="flex items-center gap-1 ml-4"
          role="group"
          aria-label="Color palette"
        >
          {BRUSH_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`color-button w-6 h-6 rounded border-2 transition-all ${
                currentColor === color
                  ? "border-gray-800 scale-110"
                  : "border-gray-400"
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select ${color} color`}
              title={color}
            />
          ))}
        </div>
      )}

      {/* Brush Size Control */}
      <div className="flex items-center gap-2 ml-4">
        <label htmlFor="brush-size" className="text-sm">
          Size:
        </label>
        <input
          id="brush-size"
          type="range"
          min="1"
          max="20"
          value={currentSize}
          onChange={(e) => setCurrentSize(Number(e.target.value))}
          className="w-20"
          aria-label="Brush size"
        />
        <span className="text-sm w-6 text-center">{currentSize}</span>
      </div>

      {/* Actions */}
      <button
        onClick={clearCanvas}
        className="toolbar-button px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 ml-auto transition-all"
        aria-label="Clear canvas"
      >
        🗑️ Clear
      </button>

      {/* Status Indicators */}
      <div
        className="flex items-center gap-2"
        role="status"
        aria-label="Connection status"
      >
        <div
          className={`w-2 h-2 rounded-full connection-indicator ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
          aria-hidden="true"
        />
        <span className="text-xs">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  )
);

DrawingToolbar.displayName = "DrawingToolbar";

// ===== Main Component =====
export const Block: React.FC<BlockProps> = ({
  canvasWidth = 800,
  canvasHeight = 600,
  brushSize = 3,
  brushColor = "#000000",
  backgroundColor = "#ffffff",
  enableEraser = true,
  maxStrokes = 1000,
  showCursors = true,
  documentId = "default-canvas",
}) => {
  // ===== Refs =====
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const offscreenContextRef = useRef<OffscreenCanvasRenderingContext2D | null>(
    null
  );
  const animationFrameRef = useRef<number | null>(null);
  const lastRenderTime = useRef<number>(0);
  const isDirty = useRef<boolean>(false);
  const lastCursorUpdate = useRef<number>(0);
  const strokeBatchRef = useRef<DrawingStroke[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderScheduled = useRef<boolean>(false);

  // ===== State =====
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<"brush" | "eraser">("brush");
  const [currentColor, setCurrentColor] = useState(brushColor);
  const [currentSize, setCurrentSize] = useState(brushSize);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(
    null
  );
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  // ===== Collaborative State =====
  const { state, update, userId, isConnected, connectionStatus } =
    useCollabSpace<CollaborativeState>(`drawing:${documentId}`, {
      strokes: [],
      cursors: {},
    });

  // Debug log to track state changes
  useEffect(() => {
    console.log("Canvas state updated:", {
      strokeCount: state.strokes.length,
      cursorCount: Object.keys(state.cursors).length,
      userIds: Object.keys(state.cursors),
      currentUserId: userId,
    });
  }, [state.strokes.length, Object.keys(state.cursors).length, userId]);

  // ===== Memoized Values =====
  const activeCursors = useMemo(() => {
    const now = Date.now();
    return Object.entries(state.cursors).filter(
      ([id, cursor]) =>
        id !== userId &&
        now - cursor.timestamp < RENDERING_CONFIG.CURSOR_TIMEOUT_MS
    );
  }, [state.cursors, userId]);

  const strokeCount = useMemo(
    () => state.strokes.length,
    [state.strokes] // Changed from [state.strokes.length] to [state.strokes] for better stability
  );

  const activeUsers = useMemo(
    () => Object.keys(state.cursors).length,
    [state.cursors]
  );

  // Memoize strokes separately to prevent resets
  const memoizedStrokes = useMemo(() => state.strokes, [state.strokes]);

  // ===== Rendering Functions =====
  const renderStroke = useCallback(
    (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
      if (stroke.points.length < 2) return;

      const path = new Path2D();
      path.moveTo(stroke.points[0].x, stroke.points[0].y);

      // Use quadratic curves for smoother lines
      if (stroke.points.length >= 3) {
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const currentPoint = stroke.points[i];
          const nextPoint = stroke.points[i + 1];
          const controlX = (currentPoint.x + nextPoint.x) / 2;
          const controlY = (currentPoint.y + nextPoint.y) / 2;
          path.quadraticCurveTo(
            currentPoint.x,
            currentPoint.y,
            controlX,
            controlY
          );
        }
        const lastPoint = stroke.points[stroke.points.length - 1];
        path.lineTo(lastPoint.x, lastPoint.y);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          path.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      }

      ctx.stroke(path);
    },
    []
  );

  const scheduleRender = useCallback(() => {
    if (renderScheduled.current) return;
    renderScheduled.current = true;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      renderScheduled.current = false;
      const now = performance.now();

      // Throttle rendering to target FPS
      if (now - lastRenderTime.current < RENDERING_CONFIG.FRAME_TIME_MS) return;
      lastRenderTime.current = now;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      // Clear and redraw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Use memoized strokes to prevent resets
      if (memoizedStrokes.length === 0) return;

      // Batch render all strokes
      ctx.save();

      // Group strokes by color and size for better performance
      const strokeGroups = new Map<string, DrawingStroke[]>();

      memoizedStrokes.forEach((stroke) => {
        if (stroke.points.length < 2) return;
        const key = `${stroke.color}-${stroke.size}`;
        const group = strokeGroups.get(key) || [];
        group.push(stroke);
        strokeGroups.set(key, group);
      });

      // Render each group efficiently
      strokeGroups.forEach((strokes, key) => {
        const [color, size] = key.split("-");

        // Set composite operation for eraser strokes
        ctx.globalCompositeOperation =
          color === backgroundColor ? "destination-out" : "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth = Number(size);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        strokes.forEach((stroke) => renderStroke(ctx, stroke));
      });

      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
      isDirty.current = false;
    });
  }, [
    memoizedStrokes,
    canvasWidth,
    canvasHeight,
    backgroundColor,
    renderStroke,
  ]);

  // ===== Effects =====
  // Cleanup batch timeout and animation frames on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Initialize canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Initialize offscreen canvas for better performance
    if (typeof OffscreenCanvas !== "undefined") {
      offscreenCanvasRef.current = new OffscreenCanvas(
        canvasWidth,
        canvasHeight
      );
      offscreenContextRef.current = offscreenCanvasRef.current.getContext("2d");
    }

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Set canvas optimization settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }, [canvasWidth, canvasHeight, backgroundColor]);

  // Trigger re-render when strokes change (using memoized strokes to prevent resets)
  useEffect(() => {
    isDirty.current = true;
    scheduleRender();
  }, [memoizedStrokes, scheduleRender]);

  // ===== Event Handlers =====
  const getEventPosition = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      } else if ("clientX" in e) {
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY,
        };
      }
      return { x: 0, y: 0 };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const pos = getEventPosition(e);
      setIsDrawing(true);

      const strokeId = generateStrokeId(userId);
      const newStroke: DrawingStroke = {
        id: strokeId,
        userId: userId,
        points: [pos],
        color: currentTool === "eraser" ? backgroundColor : currentColor,
        size: currentTool === "eraser" ? currentSize * 2 : currentSize,
        timestamp: Date.now(),
      };

      setCurrentStroke(newStroke);
    },
    [
      getEventPosition,
      userId,
      currentColor,
      currentSize,
      currentTool,
      backgroundColor,
    ]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !currentStroke) return;
      e.preventDefault();

      const pos = getEventPosition(e);
      const lastPoint = currentStroke.points[currentStroke.points.length - 1];

      // Dynamic distance threshold based on brush size for performance
      const minDistance = getMinDrawDistance(currentSize);
      const distance = calculateDistance(lastPoint, pos);

      if (distance < minDistance) return;

      const updatedStroke = {
        ...currentStroke,
        points: [...currentStroke.points, pos],
      };

      setCurrentStroke(updatedStroke);

      // Immediate local feedback with optimized rendering
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx && lastPoint) {
        ctx.save();
        ctx.globalCompositeOperation =
          currentTool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = updatedStroke.color;
        ctx.lineWidth = updatedStroke.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.restore();
      }

      // Throttled cursor updates with better state management
      const now = Date.now();
      const timeSinceLastUpdate = now - lastCursorUpdate.current;
      const updateInterval = isDrawing
        ? RENDERING_CONFIG.CURSOR_UPDATE_INTERVAL_DRAWING
        : RENDERING_CONFIG.CURSOR_UPDATE_INTERVAL_IDLE;

      if (timeSinceLastUpdate > updateInterval) {
        lastCursorUpdate.current = now;
        // Use callback to avoid stale state references
        update((prev) => {
          // Don't update if cursor position hasn't changed significantly
          const existingCursor = prev.cursors[userId];
          if (
            existingCursor &&
            Math.abs(existingCursor.x - pos.x) < 2 &&
            Math.abs(existingCursor.y - pos.y) < 2
          ) {
            return prev; // Return same state to prevent unnecessary updates
          }

          return {
            ...prev,
            cursors: {
              ...prev.cursors,
              [userId]: {
                userId,
                x: pos.x,
                y: pos.y,
                color: currentColor,
                timestamp: now,
              },
            },
          };
        });
      }
    },
    [
      isDrawing,
      currentStroke,
      getEventPosition,
      userId,
      currentColor,
      currentTool,
      currentSize,
      update,
    ]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentStroke) return;

    setIsDrawing(false);

    // Only add stroke if it has meaningful content
    if (currentStroke.points.length < 2) {
      setCurrentStroke(null);
      return;
    }

    const finalStroke = { ...currentStroke };

    // Clear any pending batch operations
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // Efficient stroke update with optimization for large stroke counts
    update((prev) => {
      let newStrokes = [...prev.strokes, finalStroke];

      // Implement efficient stroke pruning when approaching limit
      if (newStrokes.length > maxStrokes) {
        const pruneCount = Math.floor(
          maxStrokes * RENDERING_CONFIG.STROKE_PRUNING_PERCENTAGE
        );
        newStrokes = newStrokes.slice(pruneCount);
      }

      return {
        ...prev,
        strokes: newStrokes,
      };
    });

    setCurrentStroke(null);
  }, [isDrawing, currentStroke, update, maxStrokes]);

  const clearCanvas = useCallback(() => {
    update((prev) => ({
      ...prev,
      strokes: [],
    }));
  }, [update]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getEventPosition(e);
      setMousePosition(pos);

      if (isDrawing) {
        draw(e);
      } else {
        // Throttle cursor updates for non-drawing movement with better state management
        const now = Date.now();
        if (
          now - lastCursorUpdate.current >
          RENDERING_CONFIG.CURSOR_UPDATE_INTERVAL_IDLE
        ) {
          lastCursorUpdate.current = now;
          update((prev) => {
            // Don't update if cursor position hasn't changed significantly
            const existingCursor = prev.cursors[userId];
            if (
              existingCursor &&
              Math.abs(existingCursor.x - pos.x) < 5 &&
              Math.abs(existingCursor.y - pos.y) < 5
            ) {
              return prev; // Return same state to prevent unnecessary updates
            }

            return {
              ...prev,
              cursors: {
                ...prev.cursors,
                [userId]: {
                  userId,
                  x: pos.x,
                  y: pos.y,
                  color: currentColor,
                  timestamp: now,
                },
              },
            };
          });
        }
      }
    },
    [isDrawing, getEventPosition, userId, currentColor, update, draw]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setMousePosition(null);
    if (isDrawing) {
      stopDrawing();
    }
  }, [isDrawing, stopDrawing]);

  // Touch event handlers with proper prevention of default behavior
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      startDrawing(e);
    },
    [startDrawing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      draw(e);
    },
    [draw]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    },
    [stopDrawing]
  );

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        backgroundColor: "#ffffff",
        color: "#1f2937",
      }}
    >
      {/* Optimized Toolbar Component */}
      <DrawingToolbar
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        enableEraser={enableEraser}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        currentSize={currentSize}
        setCurrentSize={setCurrentSize}
        clearCanvas={clearCanvas}
        isConnected={isConnected}
        strokeCount={strokeCount}
        maxStrokes={maxStrokes}
        activeUsers={activeUsers}
      />

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden canvas-container">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="drawing-canvas border border-gray-300"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderColor: "#d1d5db",
                cursor: currentTool === "eraser" ? "none" : "crosshair",
              }}
              onMouseDown={startDrawing}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />

            {/* Tool Preview Components */}
            {currentTool === "eraser" && isHovering && mousePosition && (
              <div
                className="absolute tool-preview border-2 border-red-500 rounded-full"
                style={{
                  left: mousePosition.x - (currentSize * 2) / 2,
                  top: mousePosition.y - (currentSize * 2) / 2,
                  width: currentSize * 2,
                  height: currentSize * 2,
                  backgroundColor: "rgba(255, 0, 0, 0.1)",
                  zIndex: 5,
                  pointerEvents: "none",
                }}
              />
            )}

            {currentTool === "brush" &&
              isHovering &&
              mousePosition &&
              !isDrawing && (
                <div
                  className="absolute tool-preview border-2 rounded-full"
                  style={{
                    left: mousePosition.x - currentSize / 2,
                    top: mousePosition.y - currentSize / 2,
                    width: currentSize,
                    height: currentSize,
                    borderColor: currentColor,
                    backgroundColor: `${currentColor}20`,
                    zIndex: 5,
                    pointerEvents: "none",
                  }}
                />
              )}

            {/* Optimized User Cursors */}
            {showCursors &&
              activeCursors.map(([id, cursor]) => (
                <UserCursor key={id} cursor={cursor} userId={id} />
              ))}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div
        className="p-2 border-t text-xs flex justify-between"
        style={{
          backgroundColor: "#f3f4f6",
          borderColor: "#d1d5db",
        }}
      >
        <span>
          Strokes: {strokeCount}/{maxStrokes}
        </span>
        <span>Active Users: {activeUsers}</span>
        <span>
          {isConnected ? "🟢" : "🔴"} {connectionStatus || "Unknown"}
        </span>
      </div>
    </div>
  );
};
