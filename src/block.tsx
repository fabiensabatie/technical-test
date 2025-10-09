import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useCollabSpace, getUserId } from "@mexty/realtime";

// Types and Interfaces
interface BlockProps {
  playerOneColor?: string;
  playerTwoColor?: string;
  boardTheme?: "classic" | "modern" | "neon";
  roomId?: string;
  showMoveHistory?: boolean;
  onVisualSettingsChange?: (settings: {
    playerOneColor: string;
    playerTwoColor: string;
    boardTheme: string;
  }) => void;
}

type PieceType = "normal" | "king";
type Player = "player1" | "player2";

interface Piece {
  id: string;
  player: Player;
  type: PieceType;
  row: number;
  col: number;
}

interface Move {
  row: number;
  col: number;
  isCapture?: boolean;
  capturedPiece?: Piece;
}

interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Player;
  selectedPiece: Piece | null;
  validMoves: Move[];
  capturedPieces: Piece[];
  winner: Player | null;
  moveHistory: string[];
}

interface MultiplayerState {
  gameState: GameState;
  players: {
    player1?: string;
    player2?: string;
  };
  spectators: string[];
  visualSettings: {
    playerOneColor: string;
    playerTwoColor: string;
    boardTheme: string;
  };
}

interface ThemeStyles {
  lightSquare: string;
  darkSquare: string;
  boardBorder: string;
  selectedSquare: string;
  validMove: string;
}

// Constants
const BOARD_SIZE = 8;
const PLAYER_LABELS = {
  player1: "Player 1",
  player2: "Player 2",
} as const;

// Game Logic Utilities
const initializeBoard = (
  boardSize: number = BOARD_SIZE
): (Piece | null)[][] => {
  const board: (Piece | null)[][] = Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill(null));

  // Place pieces for both players
  const placePieces = (startRow: number, endRow: number, player: Player) => {
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < boardSize; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = {
            id: `${player}-${row}-${col}`,
            player,
            type: "normal",
            row,
            col,
          };
        }
      }
    }
  };

  placePieces(0, 3, "player1"); // Top rows
  placePieces(boardSize - 3, boardSize, "player2"); // Bottom rows

  return board;
};

const getValidMoves = (piece: Piece, board: (Piece | null)[][]): Move[] => {
  const moves: Move[] = [];
  const { row, col, player, type } = piece;
  const boardSize = board.length;

  const directions =
    type === "king"
      ? [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ] // Kings move in all directions
      : player === "player1"
      ? [
          [1, -1],
          [1, 1],
        ] // Player 1 moves down
      : [
          [-1, -1],
          [-1, 1],
        ]; // Player 2 moves up

  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (
      newRow < 0 ||
      newRow >= boardSize ||
      newCol < 0 ||
      newCol >= boardSize
    ) {
      continue;
    }

    const targetSquare = board[newRow][newCol];

    if (!targetSquare) {
      moves.push({ row: newRow, col: newCol });
    } else if (targetSquare.player !== player) {
      // Check for capture possibility
      const captureRow = newRow + dRow;
      const captureCol = newCol + dCol;

      if (
        captureRow >= 0 &&
        captureRow < boardSize &&
        captureCol >= 0 &&
        captureCol < boardSize &&
        !board[captureRow][captureCol]
      ) {
        moves.push({
          row: captureRow,
          col: captureCol,
          isCapture: true,
          capturedPiece: targetSquare,
        });
      }
    }
  }

  return moves;
};

const shouldBecomeKing = (piece: Piece, boardSize: number): boolean => {
  return (
    (piece.player === "player1" && piece.row === boardSize - 1) ||
    (piece.player === "player2" && piece.row === 0)
  );
};

const checkWinner = (
  board: (Piece | null)[][],
  currentPlayer: Player
): Player | null => {
  const player1Pieces = board
    .flat()
    .filter((piece) => piece?.player === "player1");
  const player2Pieces = board
    .flat()
    .filter((piece) => piece?.player === "player2");

  if (player1Pieces.length === 0) return "player2";
  if (player2Pieces.length === 0) return "player1";

  // Check if current player has valid moves
  const currentPlayerPieces = board
    .flat()
    .filter((piece) => piece?.player === currentPlayer);
  const hasValidMoves = currentPlayerPieces.some(
    (piece) => piece && getValidMoves(piece, board).length > 0
  );

  return hasValidMoves
    ? null
    : currentPlayer === "player1"
    ? "player2"
    : "player1";
};

const createMoveDescription = (
  piece: Piece,
  targetRow: number,
  targetCol: number,
  isCapture: boolean
): string => {
  const fromSquare = `${String.fromCharCode(65 + piece.col)}${piece.row + 1}`;
  const toSquare = `${String.fromCharCode(65 + targetCol)}${targetRow + 1}`;
  return `${piece.player} ${piece.type} ${fromSquare} to ${toSquare}${
    isCapture ? " (capture)" : ""
  }`;
};

// Theme utilities
const getThemeStyles = (theme: BlockProps["boardTheme"]): ThemeStyles => {
  const themes = {
    modern: {
      lightSquare: "bg-gray-100",
      darkSquare: "bg-gray-800",
      boardBorder: "border-gray-400",
      selectedSquare: "bg-yellow-300",
      validMove: "bg-green-300",
    },
    neon: {
      lightSquare: "bg-purple-200",
      darkSquare: "bg-purple-900",
      boardBorder: "border-purple-500",
      selectedSquare: "bg-cyan-400",
      validMove: "bg-lime-400",
    },
    classic: {
      lightSquare: "bg-amber-100",
      darkSquare: "bg-amber-800",
      boardBorder: "border-amber-600",
      selectedSquare: "bg-yellow-400",
      validMove: "bg-green-400",
    },
  };

  return themes[theme || "classic"];
};

// Component Props
interface SquareProps {
  piece: Piece | null;
  isLightSquare: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  themeStyles: ThemeStyles;
  playerOneColor: string;
  playerTwoColor: string;
  canInteract: boolean;
  onClick: () => void;
}

interface GameStatusProps {
  winner: Player | null;
  currentPlayer: Player;
  playerOneColor: string;
  playerTwoColor: string;
  localPlayer: Player | null;
}

interface SidebarProps {
  isConnected: boolean;
  connectionStatus: string;
  roomId: string;
  players: MultiplayerState["players"];
  spectators: string[];
  localPlayer: Player | null;
  isSpectator: boolean;
  capturedPieces: Piece[];
  playerOneColor: string;
  playerTwoColor: string;
  showMoveHistory: boolean;
  moveHistory: string[];
  boardTheme: string;
}

// Sub-components
const Square: React.FC<SquareProps> = ({
  piece,
  isLightSquare,
  isSelected,
  isValidMove,
  themeStyles,
  playerOneColor,
  playerTwoColor,
  canInteract,
  onClick,
}) => (
  <div
    className={`
      w-12 h-12 flex items-center justify-center cursor-pointer relative
      ${isLightSquare ? themeStyles.lightSquare : themeStyles.darkSquare}
      ${isSelected ? themeStyles.selectedSquare : ""}
      ${isValidMove ? themeStyles.validMove : ""}
      hover:brightness-110 transition-all duration-200
      ${!canInteract ? "cursor-not-allowed opacity-75" : ""}
    `}
    onClick={onClick}
  >
    {piece && (
      <div
        className={`
          w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center
          text-white font-bold text-xs transition-transform duration-200 hover:scale-110
        `}
        style={{
          backgroundColor:
            piece.player === "player1" ? playerOneColor : playerTwoColor,
        }}
      >
        {piece.type === "king" && "♔"}
      </div>
    )}
    {isValidMove && !piece && (
      <div className="w-3 h-3 rounded-full bg-green-600 opacity-70" />
    )}
  </div>
);

const GameStatus: React.FC<GameStatusProps> = ({
  winner,
  currentPlayer,
  playerOneColor,
  playerTwoColor,
  localPlayer,
}) => (
  <div className="mt-4 text-center">
    {winner ? (
      <div className="text-2xl font-bold text-green-600">
        🎉 {PLAYER_LABELS[winner]} Wins! 🎉
      </div>
    ) : (
      <div className="text-xl font-semibold">
        Current Player:
        <span
          className="ml-2 px-3 py-1 rounded text-white"
          style={{
            backgroundColor:
              currentPlayer === "player1" ? playerOneColor : playerTwoColor,
          }}
        >
          {PLAYER_LABELS[currentPlayer]}
        </span>
        {localPlayer && (
          <div className="text-sm mt-1 text-gray-600">
            {currentPlayer === localPlayer ? "Your turn!" : "Opponent's turn"}
          </div>
        )}
      </div>
    )}
  </div>
);

const CapturedPieces: React.FC<{
  pieces: Piece[];
  playerOneColor: string;
  playerTwoColor: string;
}> = ({ pieces, playerOneColor, playerTwoColor }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <h3 className="text-lg font-semibold mb-3">Captured Pieces</h3>
    <div className="space-y-2">
      {(["player1", "player2"] as const).map((player) => (
        <div key={player} className="flex flex-wrap gap-1">
          <span className="text-sm font-medium">{PLAYER_LABELS[player]}:</span>
          {pieces
            .filter((piece) => piece.player === player)
            .map((piece, index) => (
              <div
                key={`${piece.id}-captured-${index}`}
                className="w-6 h-6 rounded-full border flex items-center justify-center text-xs text-white"
                style={{
                  backgroundColor:
                    player === "player1" ? playerOneColor : playerTwoColor,
                }}
              >
                {piece.type === "king" && "♔"}
              </div>
            ))}
        </div>
      ))}
    </div>
  </div>
);

const MoveHistory: React.FC<{ moves: string[] }> = ({ moves }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <h3 className="text-lg font-semibold mb-3">Move History</h3>
    <div className="max-h-60 overflow-y-auto space-y-1">
      {moves.length === 0 ? (
        <p className="text-gray-500 text-sm">No moves yet</p>
      ) : (
        moves.map((move, index) => (
          <div key={index} className="text-sm p-2 bg-gray-50 rounded">
            {index + 1}. {move}
          </div>
        ))
      )}
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({
  isConnected,
  connectionStatus,
  roomId,
  players,
  spectators,
  localPlayer,
  isSpectator,
  capturedPieces,
  playerOneColor,
  playerTwoColor,
  showMoveHistory,
  moveHistory,
  boardTheme,
}) => (
  <div className="w-full lg:w-80 space-y-6">
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Multiplayer Status</h3>
      <div className="space-y-2 text-sm">
        <div>
          Room:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
            {roomId}
          </code>
        </div>
        <div>
          Connection:{" "}
          <span className={isConnected ? "text-green-600" : "text-red-600"}>
            {connectionStatus}
          </span>
        </div>
        <div>Player 1: {players.player1 ? "✅ Connected" : "❌ Waiting"}</div>
        <div>Player 2: {players.player2 ? "✅ Connected" : "❌ Waiting"}</div>
        {spectators.length > 0 && <div>Spectators: {spectators.length}</div>}
        {localPlayer && (
          <div className="mt-2 p-2 bg-blue-50 rounded">
            You are{" "}
            <strong>
              {localPlayer === "player1" ? "Player 1" : "Player 2"}
            </strong>
          </div>
        )}
        {isSpectator && (
          <div className="mt-2 p-2 bg-purple-50 rounded">
            You are <strong>Spectating</strong>
          </div>
        )}
      </div>
    </div>

    <CapturedPieces
      pieces={capturedPieces}
      playerOneColor={playerOneColor}
      playerTwoColor={playerTwoColor}
    />

    {showMoveHistory && <MoveHistory moves={moveHistory} />}

    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Game Settings</h3>
      <div className="space-y-2 text-sm">
        <div>
          Board Size: {BOARD_SIZE}×{BOARD_SIZE}
        </div>
        <div>Theme: {boardTheme}</div>
        <div>Multiplayer: Enabled</div>
        <div>Room: {roomId}</div>
      </div>
    </div>
  </div>
);
// Main Component
export const Block: React.FC<BlockProps> = ({
  playerOneColor = "#dc2626",
  playerTwoColor = "#1d4ed8",
  boardTheme = "classic",
  roomId = "checkers-default-room",
  showMoveHistory = true,
  onVisualSettingsChange,
}) => {
  // Local state
  const [localSelectedPiece, setLocalSelectedPiece] = useState<Piece | null>(
    null
  );
  const [localValidMoves, setLocalValidMoves] = useState<Move[]>([]);
  const userId = getUserId();

  // Ref to track previous prop values to detect actual changes
  const prevPropsRef = useRef({
    playerOneColor,
    playerTwoColor,
    boardTheme,
  });

  // Memoized initial state
  const initialMultiplayerState = useMemo(
    (): MultiplayerState => ({
      gameState: {
        board: initializeBoard(BOARD_SIZE),
        currentPlayer: "player1",
        selectedPiece: null,
        validMoves: [],
        capturedPieces: [],
        winner: null,
        moveHistory: [],
      },
      players: {},
      spectators: [],
      visualSettings: {
        playerOneColor,
        playerTwoColor,
        boardTheme,
      },
    }),
    [playerOneColor, playerTwoColor, boardTheme]
  );

  // Collaborative space hook
  const {
    state: multiplayerState,
    update: updateMultiplayerState,
    isConnected,
    connectionStatus,
  } = useCollabSpace(roomId, initialMultiplayerState, {
    onConnect: () => console.log("Connected to multiplayer room:", roomId),
    onDisconnect: () => console.log("Disconnected from multiplayer room"),
    onError: (error) => console.error("Multiplayer error:", error),
  });

  // Derived state
  const { gameState, players, spectators, visualSettings } = multiplayerState;
  const localPlayer =
    players.player1 === userId
      ? "player1"
      : players.player2 === userId
      ? "player2"
      : null;
  const isSpectator = localPlayer === null;

  // Use synchronized visual settings
  const syncedPlayerOneColor = visualSettings?.playerOneColor || playerOneColor;
  const syncedPlayerTwoColor = visualSettings?.playerTwoColor || playerTwoColor;
  const syncedBoardTheme =
    (visualSettings?.boardTheme as BlockProps["boardTheme"]) || boardTheme;
  const themeStyles = useMemo(
    () => getThemeStyles(syncedBoardTheme),
    [syncedBoardTheme]
  );

  // Player assignment effect
  useEffect(() => {
    if (!isConnected) return;

    if (!players.player1) {
      updateMultiplayerState({ players: { ...players, player1: userId } });
    } else if (!players.player2 && players.player1 !== userId) {
      updateMultiplayerState({ players: { ...players, player2: userId } });
    } else if (
      players.player1 !== userId &&
      players.player2 !== userId &&
      !spectators.includes(userId)
    ) {
      updateMultiplayerState({ spectators: [...spectators, userId] });
    }
  }, [isConnected, players, spectators, userId, updateMultiplayerState]);

  // Board validation effect - reset if board size doesn't match
  useEffect(() => {
    if (!isConnected || !gameState.board) return;

    // Check if board size matches expected BOARD_SIZE
    if (
      gameState.board.length !== BOARD_SIZE ||
      gameState.board[0]?.length !== BOARD_SIZE
    ) {
      console.log("Board size mismatch detected, resetting game...");
      const newGameState: GameState = {
        board: initializeBoard(BOARD_SIZE),
        currentPlayer: "player1",
        selectedPiece: null,
        validMoves: [],
        capturedPieces: [],
        winner: null,
        moveHistory: [],
      };
      updateMultiplayerState({ gameState: newGameState });
    }
  }, [isConnected, gameState.board, updateMultiplayerState]);

  // Visual settings synchronization effect - only sync user-initiated changes
  useEffect(() => {
    if (!isConnected) return;

    // Check if props have actually changed from previous values (user input)
    const prevProps = prevPropsRef.current;
    const propsChanged =
      prevProps.playerOneColor !== playerOneColor ||
      prevProps.playerTwoColor !== playerTwoColor ||
      prevProps.boardTheme !== boardTheme;

    if (propsChanged) {
      console.log("User changed props, syncing to other players:", {
        playerOneColor,
        playerTwoColor,
        boardTheme,
      });

      // Update multiplayer state (this will sync to other players)
      updateMultiplayerState({
        visualSettings: {
          playerOneColor,
          playerTwoColor,
          boardTheme,
        },
      });

      // Update the ref to prevent re-triggering
      prevPropsRef.current = {
        playerOneColor,
        playerTwoColor,
        boardTheme,
      };
    }
  }, [
    isConnected,
    playerOneColor,
    playerTwoColor,
    boardTheme,
    updateMultiplayerState,
  ]);

  // Notify parent when OTHER players change visual settings (not our own changes)
  useEffect(() => {
    if (!visualSettings || !onVisualSettingsChange) return;

    // Only notify if the synced settings are different from our current props
    // AND different from what we last sent (to avoid loops)
    const settingsFromOthers =
      visualSettings.playerOneColor !== playerOneColor ||
      visualSettings.playerTwoColor !== playerTwoColor ||
      visualSettings.boardTheme !== boardTheme;

    if (settingsFromOthers) {
      console.log(
        "Received settings from other players, updating local props:",
        visualSettings
      );
      onVisualSettingsChange({
        playerOneColor: visualSettings.playerOneColor,
        playerTwoColor: visualSettings.playerTwoColor,
        boardTheme: visualSettings.boardTheme,
      });

      // Update our ref to match the new values to prevent loops
      prevPropsRef.current = {
        playerOneColor: visualSettings.playerOneColor,
        playerTwoColor: visualSettings.playerTwoColor,
        boardTheme:
          (visualSettings.boardTheme as BlockProps["boardTheme"]) || "classic",
      };
    }
  }, [visualSettings, onVisualSettingsChange]);

  // Game state update function
  const updateGameState = useCallback(
    (newGameState: GameState) => {
      updateMultiplayerState({ gameState: newGameState });
    },
    [updateMultiplayerState]
  );

  // Move execution logic
  const executeMove = useCallback(
    (piece: Piece, targetRow: number, targetCol: number, validMove: Move) => {
      const newBoard = gameState.board.map((row) => [...row]);

      // Remove piece from old position
      newBoard[piece.row][piece.col] = null;

      // Handle capture
      let capturedPieces = [...gameState.capturedPieces];
      if (validMove.isCapture && validMove.capturedPiece) {
        const { row: capturedRow, col: capturedCol } = validMove.capturedPiece;
        newBoard[capturedRow][capturedCol] = null;
        capturedPieces.push(validMove.capturedPiece);
      }

      // Place piece in new position
      const movedPiece: Piece = {
        ...piece,
        row: targetRow,
        col: targetCol,
        type: shouldBecomeKing(piece, BOARD_SIZE) ? "king" : piece.type,
      };
      newBoard[targetRow][targetCol] = movedPiece;

      // Create new game state
      const nextPlayer: Player =
        gameState.currentPlayer === "player1" ? "player2" : "player1";
      const moveDescription = createMoveDescription(
        piece,
        targetRow,
        targetCol,
        !!validMove.isCapture
      );

      return {
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedPiece: null,
        validMoves: [],
        capturedPieces,
        winner: checkWinner(newBoard, nextPlayer),
        moveHistory: [...gameState.moveHistory, moveDescription],
      };
    },
    [gameState]
  );

  // Square click handler
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (gameState.winner) return;

      // Prevent interaction when not player's turn
      if (gameState.currentPlayer !== localPlayer || isSpectator) return;

      const clickedPiece = gameState.board[row][col];

      if (localSelectedPiece) {
        const validMove = localValidMoves.find(
          (move) => move.row === row && move.col === col
        );

        if (validMove) {
          const newGameState = executeMove(
            localSelectedPiece,
            row,
            col,
            validMove
          );
          setLocalSelectedPiece(null);
          setLocalValidMoves([]);
          updateGameState(newGameState);
        } else if (clickedPiece?.player === gameState.currentPlayer) {
          // Select different piece
          const validMoves = getValidMoves(clickedPiece, gameState.board);
          setLocalSelectedPiece(clickedPiece);
          setLocalValidMoves(validMoves);
        } else {
          // Deselect
          setLocalSelectedPiece(null);
          setLocalValidMoves([]);
        }
      } else if (clickedPiece?.player === gameState.currentPlayer) {
        // Select piece
        const validMoves = getValidMoves(clickedPiece, gameState.board);
        setLocalSelectedPiece(clickedPiece);
        setLocalValidMoves(validMoves);
      }
    },
    [
      gameState,
      localSelectedPiece,
      localValidMoves,
      localPlayer,
      isSpectator,
      executeMove,
      updateGameState,
    ]
  );

  // Reset game function
  const resetGame = useCallback(() => {
    const newGameState: GameState = {
      board: initializeBoard(BOARD_SIZE),
      currentPlayer: "player1",
      selectedPiece: null,
      validMoves: [],
      capturedPieces: [],
      winner: null,
      moveHistory: [],
    };

    setLocalSelectedPiece(null);
    setLocalValidMoves([]);
    updateGameState(newGameState);
  }, [updateGameState]);

  const canInteract =
    !gameState.winner &&
    gameState.currentPlayer === localPlayer &&
    !isSpectator;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 w-full h-full bg-gray-50 min-h-screen">
      {/* Game Board */}
      <div className="flex-1 flex flex-col items-center">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Checkers Game
          </h1>

          {/* Multiplayer Status */}
          <div className="text-center mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              Connection:{" "}
              <span
                className={`font-medium ${
                  isConnected ? "text-green-600" : "text-red-600"
                }`}
              >
                {connectionStatus}
              </span>
            </p>
            {isConnected && (
              <>
                {localPlayer && (
                  <p className="text-sm text-blue-600">
                    You are{" "}
                    <strong>
                      {localPlayer === "player1"
                        ? "Player 1 (Red)"
                        : "Player 2 (Blue)"}
                    </strong>
                  </p>
                )}
                {isSpectator && (
                  <p className="text-sm text-purple-600">
                    You are <strong>Spectating</strong>
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Players: {players.player1 ? "1" : "0"}/2 connected
                  {spectators.length > 0 &&
                    ` • ${spectators.length} spectator(s)`}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Board */}
        <div
          className={`grid gap-0 border-4 ${themeStyles.boardBorder} shadow-lg`}
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {gameState.board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const isLightSquare = (rowIndex + colIndex) % 2 === 0;
              const isSelected =
                localSelectedPiece?.row === rowIndex &&
                localSelectedPiece?.col === colIndex;
              const isValidMove = localValidMoves.some(
                (move) => move.row === rowIndex && move.col === colIndex
              );

              return (
                <Square
                  key={`${rowIndex}-${colIndex}`}
                  piece={piece}
                  isLightSquare={isLightSquare}
                  isSelected={isSelected}
                  isValidMove={isValidMove}
                  themeStyles={themeStyles}
                  playerOneColor={syncedPlayerOneColor}
                  playerTwoColor={syncedPlayerTwoColor}
                  canInteract={canInteract}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                />
              );
            })
          )}
        </div>

        {/* Game Status */}
        <GameStatus
          winner={gameState.winner}
          currentPlayer={gameState.currentPlayer}
          playerOneColor={syncedPlayerOneColor}
          playerTwoColor={syncedPlayerTwoColor}
          localPlayer={localPlayer}
        />

        {/* Reset Button */}
        <button
          onClick={resetGame}
          disabled={!localPlayer}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          New Game
        </button>

        {/* Waiting for player message */}
        {!players.player2 && (
          <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
            <p className="text-yellow-800 font-medium">
              Waiting for second player...
            </p>
            <p className="text-yellow-600 text-sm mt-1">
              Share this room ID:{" "}
              <code className="bg-yellow-200 px-2 py-1 rounded">{roomId}</code>
            </p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <Sidebar
        isConnected={isConnected}
        connectionStatus={connectionStatus}
        roomId={roomId}
        players={players}
        spectators={spectators}
        localPlayer={localPlayer}
        isSpectator={isSpectator}
        capturedPieces={gameState.capturedPieces}
        playerOneColor={syncedPlayerOneColor}
        playerTwoColor={syncedPlayerTwoColor}
        showMoveHistory={showMoveHistory}
        moveHistory={gameState.moveHistory}
        boardTheme={syncedBoardTheme}
      />
    </div>
  );
};
