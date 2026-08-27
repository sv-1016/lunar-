import React, { useEffect, useRef } from 'react';

export const StarBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate stars
    const starCount = 140;
    const stars: { x: number; y: number; size: number; alpha: number; speed: number; pulse: number }[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.03 + 0.01,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Soft nebula glow
      const grad1 = ctx.createRadialGradient(width * 0.2, height * 0.15, 10, width * 0.2, height * 0.15, width * 0.6);
      grad1.addColorStop(0, 'rgba(53, 198, 244, 0.035)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 10, width * 0.8, height * 0.7, width * 0.5);
      grad2.addColorStop(0, 'rgba(124, 140, 255, 0.03)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      for (const star of stars) {
        star.pulse += star.speed;
        const currentAlpha = Math.max(0.1, star.alpha + Math.sin(star.pulse) * 0.35);
        ctx.fillStyle = `rgba(226, 232, 240, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 space-grid pointer-events-none opacity-40" />
    </div>
  );
};
