import { useEffect, useRef, useState } from "react";
import "./App.css";

const ROAD_WIDTH = 360;
const CAR_WIDTH = 48;
const CAR_HEIGHT = 80;
const ENEMY_WIDTH = 48;
const ENEMY_HEIGHT = 80;

const LANES = [40, 156, 272];

function App() {
  const [playerX, setPlayerX] = useState(LANES[1]);
  const [enemies, setEnemies] = useState([]);
  const [roadOffset, setRoadOffset] = useState(0);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(6);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const keys = useRef({});
  const animationRef = useRef(null);
  const lastTime = useRef(0);
  const enemyTimer = useRef(0);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event) => {
      keys.current[event.key.toLowerCase()] = true;

      if (
        ["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(
          event.key.toLowerCase()
        )
      ) {
        event.preventDefault();
      }

      if (event.key === "Enter" && gameOver) {
        restartGame();
      }
    };

    const handleKeyUp = (event) => {
      keys.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver]);

  // Start game
  useEffect(() => {
    if (!started || gameOver) return;

    lastTime.current = performance.now();

    const gameLoop = (time) => {
      const delta = Math.min((time - lastTime.current) / 16.67, 3);
      lastTime.current = time;

      updateGame(delta);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationRef.current);
  }, [started, gameOver]);

  function updateGame(delta) {
    // Move player
    setPlayerX((currentX) => {
      let newX = currentX;

      if (keys.current.arrowleft || keys.current.a) {
        newX -= 8 * delta;
      }

      if (keys.current.arrowright || keys.current.d) {
        newX += 8 * delta;
      }

      return Math.max(25, Math.min(327, newX));
    });

    // Scrolling road
    setRoadOffset((offset) => (offset + speed * delta) % 80);

    // Spawn enemy cars
    enemyTimer.current += delta;

    if (enemyTimer.current > Math.max(20, 55 - speed * 3)) {
      enemyTimer.current = 0;

      const lane = LANES[Math.floor(Math.random() * LANES.length)];

      setEnemies((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random()}`,
          x: lane,
          y: -100,
        },
      ]);
    }

    // Move enemies
    setEnemies((currentEnemies) => {
      const updated = currentEnemies
        .map((enemy) => ({
          ...enemy,
          y: enemy.y + speed * delta,
        }))
        .filter((enemy) => enemy.y < 650);

      return updated;
    });

    // Increase score
    setScore((currentScore) => currentScore + 0.05 * delta);

    // Gradually increase difficulty
    setSpeed((currentSpeed) => Math.min(13, currentSpeed + 0.002 * delta));
  }

  // Collision detection
  useEffect(() => {
    if (!started || gameOver) return;

    const player = {
      x: playerX,
      y: 490,
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
    };

    const collision = enemies.some((enemy) => {
      return (
        player.x < enemy.x + ENEMY_WIDTH &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + ENEMY_HEIGHT &&
        player.y + player.height > enemy.y
      );
    });

    if (collision) {
      setGameOver(true);
    }
  }, [playerX, enemies, started, gameOver]);

  function startGame() {
    setStarted(true);
    setGameOver(false);
  }

  function restartGame() {
    setPlayerX(LANES[1]);
    setEnemies([]);
    setRoadOffset(0);
    setScore(0);
    setSpeed(6);
    enemyTimer.current = 0;
    lastTime.current = performance.now();
    setGameOver(false);
    setStarted(true);
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <div>
          <h1>🏎️ Turbo Racer</h1>
          <p>Use ← → or A / D to drive</p>
        </div>

        <div className="score">
          <span>Score</span>
          <strong>{Math.floor(score)}</strong>
        </div>
      </div>

      <div className="game-wrapper">
        <div
          className="road"
          style={{
            "--road-offset": `${roadOffset}px`,
          }}
        >
          {/* Road lane markings */}
          <div className="lane-mark lane-mark-1" />
          <div className="lane-mark lane-mark-2" />

          {/* Player */}
          <div
            className="car player-car"
            style={{
              left: `${playerX}px`,
            }}
          >
            <div className="car-window" />
            <div className="car-body" />
            <div className="headlight left" />
            <div className="headlight right" />
            <div className="wheel wheel-left" />
            <div className="wheel wheel-right" />
          </div>

          {/* Enemy cars */}
          {enemies.map((enemy) => (
            <div
              key={enemy.id}
              className="car enemy-car"
              style={{
                left: `${enemy.x}px`,
                top: `${enemy.y}px`,
              }}
            >
              <div className="enemy-window" />
              <div className="enemy-body" />
              <div className="tail-light left" />
              <div className="tail-light right" />
              <div className="wheel wheel-left" />
              <div className="wheel wheel-right" />
            </div>
          ))}

          {/* Start screen */}
          {!started && (
            <div className="overlay">
              <div className="overlay-card">
                <div className="big-icon">🏎️</div>
                <h2>Turbo Racer</h2>
                <p>Dodge the traffic and survive as long as possible!</p>

                <button onClick={startGame}>Start Game</button>

                <small>Arrow Keys or A / D to move</small>
              </div>
            </div>
          )}

          {/* Game over */}
          {gameOver && (
            <div className="overlay">
              <div className="overlay-card">
                <div className="big-icon">💥</div>
                <h2>Game Over</h2>

                <p>
                  Your score:
                  <strong> {Math.floor(score)}</strong>
                </p>

                <button onClick={restartGame}>Play Again</button>

                <small>Press Enter to restart</small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile controls */}
      <div className="mobile-controls">
        <button
          onPointerDown={() => {
            keys.current.arrowleft = true;
          }}
          onPointerUp={() => {
            keys.current.arrowleft = false;
          }}
          onPointerLeave={() => {
            keys.current.arrowleft = false;
          }}
        >
          ◀
        </button>

        <button
          onPointerDown={() => {
            keys.current.arrowright = true;
          }}
          onPointerUp={() => {
            keys.current.arrowright = false;
          }}
          onPointerLeave={() => {
            keys.current.arrowright = false;
          }}
        >
          ▶
        </button>
      </div>

      <div className="instructions">
        <span>← →</span>
        <span>or</span>
        <span>A D</span>
        <span>to move</span>
      </div>
    </div>
  );
}

export default App;