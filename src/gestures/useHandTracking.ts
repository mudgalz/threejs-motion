import { Hands } from "@mediapipe/hands";
import { useEffect, useRef } from "react";
import { type GestureFrame } from "./types";

interface Props {
  video: HTMLVideoElement | null;
  onFrame: (data: GestureFrame) => void;
}

export function useHandTracking({ video, onFrame }: Props) {
  const cameraRef = useRef<any>(null);
  const handsRef = useRef<Hands | null>(null);

  useEffect(() => {
    if (!video) {
      // camera turned off → cleanup
      cameraRef.current?.stop();
      cameraRef.current = null;

      handsRef.current?.close();
      handsRef.current = null;

      return;
    }

    // 🟢 create mediapipe
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      if (!results.multiHandLandmarks?.length) {
        onFrame({
          detected: false,
          thumbUp: false,
          thumbDown: false,
        });
        return;
      }

      const lm = results.multiHandLandmarks[0];

      const indexTip = lm[8];
      const indexPip = lm[6];

      // Inside useHandTracking (onResults)
      const middleTip = lm[12]; // Add middle finger for better folded detection

      const thumbTip = lm[4];
      const thumbIp = lm[3];

      // A finger is "folded" if the tip is below the joint (PIP)
      const indexFolded = indexTip.y > indexPip.y;
      const middleFolded = middleTip.y > lm[10].y;

      // IMPROVED: Only trigger thumb gestures if drawing finger is tucked in
      const thumbUp = thumbTip.y < thumbIp.y && indexFolded && middleFolded;
      const thumbDown = thumbTip.y > thumbIp.y && indexFolded && middleFolded;

      onFrame({
        detected: true,
        indexFinger: indexFolded ? undefined : { x: indexTip.x, y: indexTip.y },
        thumbUp,
        thumbDown,
      });
    });

    const camera = new (window as any).Camera(video, {
      onFrame: async () => {
        if (handsRef.current) {
          await handsRef.current.send({ image: video });
        }
      },
    });

    camera.start();

    handsRef.current = hands;
    cameraRef.current = camera;

    return () => {
      cameraRef.current?.stop();
      cameraRef.current = null;

      handsRef.current?.close();
      handsRef.current = null;

      console.log("🛑 mediapipe stopped");
    };
  }, [video]);
}
