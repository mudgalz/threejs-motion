import BottomInfoText from "@/components/BottomInfoText";
import BlockBreakerCanvas from "@/components/gestures/BlockBreaker";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const BlockBreaker = () => {
  return (
    <>
      <div className="absolute top-4 left-4 z-20 flex gap-1">
        <Link to="/" tabIndex={-1}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
      </div>

      <BlockBreakerCanvas />

      <BottomInfoText text="Move your hand to aim. Pinch to smash incoming blocks." />
    </>
  );
};

export default BlockBreaker;
