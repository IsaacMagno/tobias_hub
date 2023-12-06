import React from "react";
import { Loader } from "../../components/Loader";

const Loading = ({
  textColor = "text-white",
  opacity = "opacity-60",
  textSize = "text-3xl",
  barWidth = "200",
  barHeight = "100",
  minHeight = true,
}) => {
  return (
    <Loader
      textColor={textColor}
      opacity={opacity}
      textSize={textSize}
      barWidth={barWidth}
      barHeight={barHeight}
      minHeight={minHeight}
    />
  );
};

export default Loading;
