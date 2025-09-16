import React, { useRef, useEffect, useState } from 'react';
import './RacingGame.scss';

const LANES = [150, 250, 350, 450, 550, 650];
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const RacingGame = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(2);
  const [gameRunning, setGameRunning] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalDistance, setFinalDistance] = useState(0);
  const [speedDisplay, setSpeedDisplay] = useState(0);

  // Mutable game state
  const player = useRef({
    x: CANVAS_WIDTH / 2 - 15,
    y: CANVAS_HEIGHT - 100,
    width: 30,
    height: 60,
    speed: 5,
    maxSpeed: 8
  });
  const obstacles = useRef([]);
  const roadLines = useRef([]);
  const particles = useRef([]);
  const keys = useRef({});
  const frameCount = useRef(0);
  const animationRef = useRef();

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize road lines
  useEffect(() => {
    roadLines.current = [];
    for (let i = 0; i < 15; i++) {
      roadLines.current.push({
        x: CANVAS_WIDTH / 2,
        y: i * 50 - 100,
        width: 4,
        height: 30
      });
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameRunning) return;
    const ctx = canvasRef.current.getContext('2d');

    function createObstacle() {
      obstacles.current.push({
        x: LANES[Math.floor(Math.random() * LANES.length)] - 15,
        y: -60,
        width: 30,
        height: 60,
        speed: gameSpeed + Math.random() * 2
      });
    }

    function createParticles(x, y, color) {
      for (let i = 0; i < 8; i++) {
        particles.current.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 30,
          maxLife: 30,
          color: color
        });
      }
    }

    function drawPlayer() {
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(player.current.x, player.current.y, player.current.width, player.current.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(player.current.x + 5, player.current.y + 10, 20, 15);
      ctx.fillRect(player.current.x + 5, player.current.y + 35, 20, 15);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(player.current.x + 2, player.current.y - 5, 6, 8);
      ctx.fillRect(player.current.x + 22, player.current.y - 5, 6, 8);
    }

    function drawObstacle(obs) {
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(obs.x + 5, obs.y + 10, 20, 15);
      ctx.fillRect(obs.x + 5, obs.y + 35, 20, 15);
    }

    function drawRoad() {
      ctx.fillStyle = '#333';
      ctx.fillRect(100, 0, 600, CANVAS_HEIGHT);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(95, 0, 10, CANVAS_HEIGHT);
      ctx.fillRect(695, 0, 10, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffff00';
      roadLines.current.forEach(line => {
        ctx.fillRect(line.x - line.width/2, line.y, line.width, line.height);
      });
    }

    function drawParticles() {
      particles.current.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(particle.x, particle.y, 3, 3);
      });
    }

    function update() {
      frameCount.current++;
      // Player movement
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
        player.current.x = Math.max(105, player.current.x - player.current.speed);
      }
      if (keys.current['KeyD'] || keys.current['ArrowRight']) {
        player.current.x = Math.min(665, player.current.x + player.current.speed);
      }
      if (keys.current['KeyW'] || keys.current['ArrowUp']) {
        setGameSpeed(prev => Math.min(8, prev + 0.1));
      }
      if (keys.current['KeyS'] || keys.current['ArrowDown']) {
        setGameSpeed(prev => Math.max(1, prev - 0.1));
      }
      // Update road lines
      roadLines.current.forEach(line => {
        line.y += gameSpeed * 2;
        if (line.y > CANVAS_HEIGHT) {
          line.y = -50;
        }
      });
      // Create obstacles
      if (frameCount.current % Math.max(30, 80 - Math.floor(score / 100)) === 0) {
        createObstacle();
      }
      // Update obstacles
      for (let i = obstacles.current.length - 1; i >= 0; i--) {
        const obs = obstacles.current[i];
        obs.y += obs.speed;
        if (obs.y > CANVAS_HEIGHT) {
          obstacles.current.splice(i, 1);
          setScore(s => s + 10);
        }
        // Collision
        if (
          player.current.x < obs.x + obs.width &&
          player.current.x + player.current.width > obs.x &&
          player.current.y < obs.y + obs.height &&
          player.current.y + player.current.height > obs.y
        ) {
          createParticles(player.current.x + player.current.width/2, player.current.y + player.current.height/2, '#ff4757');
          handleGameOver();
        }
      }
      // Update particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const particle = particles.current[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        if (particle.life <= 0) {
          particles.current.splice(i, 1);
        }
      }
      // Increase difficulty
      if (frameCount.current % 300 === 0) {
        setGameSpeed(prev => prev + 0.2);
      }
      // Update score and distance
      setScore(s => s + Math.floor(gameSpeed));
      setDistance(d => Math.floor((score + Math.floor(gameSpeed)) / 10));
      setSpeedDisplay(Math.floor(gameSpeed * 20));
    }

    function render() {
      ctx.fillStyle = '#1a5d3a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawRoad();
      drawParticles();
      obstacles.current.forEach(drawObstacle);
      drawPlayer();
      // Speed lines effect
      if (gameSpeed > 4) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${(gameSpeed - 4) * 0.1})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
          const x = 100 + Math.random() * 600;
          const y = Math.random() * CANVAS_HEIGHT;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + gameSpeed * 3);
          ctx.stroke();
        }
      }
    }

    function loop() {
      if (!gameRunning) return;
      update();
      render();
      animationRef.current = requestAnimationFrame(loop);
    }
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
    // eslint-disable-next-line
  }, [gameRunning, gameSpeed, score]);

  // Game over handler
  const handleGameOver = () => {
    setGameRunning(false);
    setFinalScore(score);
    setFinalDistance(distance);
    setShowGameOver(true);
  };

  // Restart game
  const restartGame = () => {
    setGameRunning(true);
    setScore(0);
    setDistance(0);
    setGameSpeed(2);
    setShowGameOver(false);
    setFinalScore(0);
    setFinalDistance(0);
    player.current.x = CANVAS_WIDTH / 2 - 15;
    player.current.y = CANVAS_HEIGHT - 100;
    obstacles.current = [];
    particles.current = [];
    frameCount.current = 0;
  };

  return (
    <div className="game-container">
      <canvas
        id="gameCanvas"
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
      />
      <div className="game-ui">
        <div className="score">Score: <span id="scoreValue">{score}</span></div>
        <div className="speed">Speed: <span id="speedValue">{speedDisplay}</span> mph</div>
      </div>
      <div className="instructions">
        <strong>Controls:</strong><br />
        A/D or ←/→ : Steer<br />
        W/S or ↑/↓ : Speed<br />
        Avoid the red cars!
      </div>
      {showGameOver && (
        <div className="game-over" id="gameOver">
          <h2>Game Over!</h2>
          <p>Final Score: <span id="finalScore">{finalScore}</span></p>
          <p>Distance: <span id="finalDistance">{finalDistance}</span>m</p>
          <button className="restart-btn" onClick={restartGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default RacingGame;
