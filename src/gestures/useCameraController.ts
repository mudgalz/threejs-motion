import { useEffect, useRef, useState } from "react";
import type { CameraStatus } from "./types";

export function useCameraController() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");

  const start = async () => {
    if (streamRef.current) return;

    try {
      setStatus("requesting");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = resolve;
        });

        await videoRef.current.play();
      }

      setStatus("ready");
    } catch (err: any) {
      console.error(err);

      if (err.name === "NotAllowedError") {
        setStatus("denied");
      } else {
        setStatus("error");
      }
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("idle");
    console.log("🛑 camera stopped");
  };

  useEffect(() => {
    return () => stop(); // stop on unmount
  }, []);

  return { videoRef, status, start, stop };
}
