import BottomInfoText from "@/components/BottomInfoText";
import FingerTrailCanvas from "@/components/gestures/FingerTrailCanvas";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const FingerTrail = () => {
  return (
    <>
      <div className="absolute top-4 left-4 z-20 flex gap-1">
        <Link to="/" tabIndex={-1}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
      </div>

      <FingerTrailCanvas />

      <BottomInfoText text="Move your hand (Palm) to draw in the air. Thumbs up to switch color and thumbs down to clear." />
    </>
  );
};

export default FingerTrail;
