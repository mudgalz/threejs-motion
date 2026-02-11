export interface Point2D {
  x: number;
  y: number;
}

export interface GestureFrame {
  indexFinger?: Point2D;
  thumbUp: boolean;
  thumbDown: boolean;
  detected: boolean;
  pinch: boolean;
}

export type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "error";

export interface CameraState {
  status: CameraStatus;
  stream: MediaStream | null;
  error?: string;
}
