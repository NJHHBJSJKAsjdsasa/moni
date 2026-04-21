// atlas-ui/react/static/js/Components/StargateAnimation.tsx
import StargateButton from "./StargateButton";

const StargateAnimation = ({ stargateUrl }) => {
  return (
    <div className="stargate-container">
      <StargateButton href={stargateUrl} />
    </div>
  );
};

export default StargateAnimation;
