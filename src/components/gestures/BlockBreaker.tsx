import { useCameraController } from "@/gestures/useCameraController";
import { useHandTracking } from "@/gestures/useHandTracking";
import { useEffect, useRef } from "react";

interface Block {
  x: number;
  y: number;
  size: number;
  type: "circle" | "rect" | "triangle" | "pentagon";
  style: "fill" | "stroke";
  vx: number;
  vy: number;
}

export default function BlockBreakerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const blocksRef = useRef<Block[]>([]);
  const hammerRef = useRef({ x: 0.5, y: 0.5 });
  const previewRef = useRef<HTMLVideoElement | null>(null);

  const camera = useCameraController();

  useEffect(() => {
    camera.start();
    return () => camera.stop();
  }, []);

  /* =========================
     HAND TRACKING
  ========================= */
  useHandTracking({
    video: camera.status === "ready" ? camera.videoRef.current : null,
    onFrame: (data) => {
      if (!data.indexFinger) return;

      // smooth follow
      hammerRef.current.x +=
        (1 - data.indexFinger.x - hammerRef.current.x) * 0.25;
      hammerRef.current.y += (data.indexFinger.y - hammerRef.current.y) * 0.25;
    },
  });

  /* =========================
     SPAWN BLOCKS
  ========================= */
  useEffect(() => {
    const spawn = () => {
      const types: Block["type"][] = ["circle", "rect", "triangle", "pentagon"];

      blocksRef.current.push({
        x: Math.random(),
        y: -0.1,
        size: 25 + Math.random() * 25,
        type: types[Math.floor(Math.random() * types.length)],
        style: Math.random() > 0.5 ? "fill" : "stroke",
        vx: (Math.random() - 0.5) * 0.002,
        vy: 0.003,
      });
    };

    const interval = setInterval(spawn, 900);
    return () => clearInterval(interval);
  }, []);

  /* =========================
     DRAW
  ========================= */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const drawShape = (b: Block) => {
      const x = b.x * canvas.width;
      const y = b.y * canvas.height;
      const s = b.size;

      ctx.beginPath();

      if (b.type === "circle") {
        ctx.arc(x, y, s, 0, Math.PI * 2);
      }

      if (b.type === "rect") {
        ctx.rect(x - s, y - s, s * 2, s * 2);
      }

      if (b.type === "triangle") {
        ctx.moveTo(x, y - s);
        ctx.lineTo(x - s, y + s);
        ctx.lineTo(x + s, y + s);
        ctx.closePath();
      }

      if (b.type === "pentagon") {
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const px = x + Math.cos(angle) * s;
          const py = y + Math.sin(angle) * s;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      }

      if (b.style === "fill") {
        ctx.fillStyle = "#ff2fff";
        ctx.shadowColor = "#ff2fff";
        ctx.shadowBlur = 15;
        ctx.fill();
      } else {
        ctx.strokeStyle = "#00eaff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#00eaff";
        ctx.shadowBlur = 10;
        ctx.stroke();
      }
    };

    const draw = () => {
      requestAnimationFrame(draw);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hx = hammerRef.current.x;
      const hy = hammerRef.current.y;

      /* move blocks */
      blocksRef.current.forEach((b) => {
        b.x += b.vx;
        b.y += b.vy;
      });

      /* destroy on hover */
      blocksRef.current = blocksRef.current.filter((b) => {
        const dx = b.x - hx;
        const dy = b.y - hy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > 0.08;
      });

      /* remove offscreen */
      blocksRef.current = blocksRef.current.filter((b) => b.y < 1.2);

      /* draw blocks */
      blocksRef.current.forEach(drawShape);

      /* draw cursor */
      ctx.fillStyle = "#00eaff";
      ctx.shadowColor = "#00eaff";
      ctx.shadowBlur = 25;

      ctx.beginPath();
      ctx.arc(
        hammerRef.current.x * canvas.width,
        hammerRef.current.y * canvas.height,
        30,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    };

    draw();

    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (previewRef.current && camera.videoRef.current) {
      previewRef.current.srcObject = camera.videoRef.current.srcObject;
    }
  }, [camera.status]);

  return (
    <>
      <video
        ref={camera.videoRef}
        className="hidden"
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="fixed inset-0" />
      <div className="fixed bottom-4 left-4 z-50 rounded-lg overflow-hidden border border-white/20 bg-black/40 backdrop-blur">
        <video
          ref={previewRef}
          autoPlay
          playsInline
          muted
          className="w-40 h-28 object-cover scale-x-[-1]"
        />
      </div>
    </>
  );
}
