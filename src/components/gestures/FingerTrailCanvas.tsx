import { useCameraController } from "@/gestures/useCameraController";
import { useHandTracking } from "@/gestures/useHandTracking";
import { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

const MAX_POINTS = 50;

const COLORS = [
  "#ff2fff",
  "#00eaff",
  "#7b5cff",
  "#00ff88",
  "#ffcc00",
  "#ff3b3b",
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function GestureDrawCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const smoothRef = useRef<Point>({ x: 0.5, y: 0.5 });
  const thumbUpStartRef = useRef<number | null>(null);
  const thumbDownStartRef = useRef<number | null>(null);

  const thumbUpLockedRef = useRef(false);
  const thumbDownLockedRef = useRef(false);

  const [colorIndex, setColorIndex] = useState(0);

  const camera = useCameraController();

  useEffect(() => {
    camera.start();
    return () => camera.stop();
  }, []);

  useHandTracking({
    video: camera.status === "ready" ? camera.videoRef.current : null,
    onFrame: (data) => {
      const now = Date.now();

      if (data.thumbUp) {
        if (!thumbUpStartRef.current) {
          thumbUpStartRef.current = now;
        }

        const held = now - thumbUpStartRef.current;

        if (held > 350 && !thumbUpLockedRef.current) {
          thumbUpLockedRef.current = true;

          setColorIndex((prev) => (prev + 1) % COLORS.length);
        }
      } else {
        thumbUpStartRef.current = null;
        thumbUpLockedRef.current = false;
      }

      if (data.thumbDown) {
        if (!thumbDownStartRef.current) {
          thumbDownStartRef.current = now;
        }

        const held = now - thumbDownStartRef.current;

        if (held > 350 && !thumbDownLockedRef.current) {
          thumbDownLockedRef.current = true;

          pointsRef.current = [];
        }
      } else {
        thumbDownStartRef.current = null;
        thumbDownLockedRef.current = false;
      }

      // draw only when finger exists
      if (!data.indexFinger) return;

      const tx = 1 - data.indexFinger.x;
      const ty = data.indexFinger.y;

      smoothRef.current.x = lerp(smoothRef.current.x, tx, 0.35);
      smoothRef.current.y = lerp(smoothRef.current.y, ty, 0.35);

      pointsRef.current.push({
        x: smoothRef.current.x,
        y: smoothRef.current.y,
      });

      if (pointsRef.current.length > MAX_POINTS) {
        pointsRef.current.shift();
      }
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      requestAnimationFrame(draw);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pts = pointsRef.current;
      if (pts.length < 2) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 22;

      ctx.strokeStyle = COLORS[colorIndex];

      ctx.shadowColor = COLORS[colorIndex];
      ctx.shadowBlur = 30;

      ctx.beginPath();

      pts.forEach((p, i) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [colorIndex]);

  return (
    <>
      <video
        ref={camera.videoRef}
        className="hidden"
        autoPlay
        playsInline
        muted
      />

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />

      {/* 🎨 color indicator */}
      <div className="fixed top-6 right-6 flex items-center gap-2 z-50">
        <div
          className="w-4 h-4 rounded-full"
          style={{ background: COLORS[colorIndex] }}
        />
        <span className="text-white text-sm">Color</span>
      </div>
    </>
  );
}
