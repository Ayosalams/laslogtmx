import React from "react";
import { useCurrentTime } from "../src/hooks/useCurrentTime";

interface MilitaryTimeDisplayProps {
  className?: string;
  style?: React.CSSProperties;
  /** Low opacity / subtle mode (default true) */
  subtle?: boolean;
}

export const MilitaryTimeDisplay: React.FC<MilitaryTimeDisplayProps> = ({
  className = "",
  style,
  subtle = true,
}) => {
  const currentTime = useCurrentTime();

  const baseClasses =
    "text-xs font-medium px-2.5 py-0.5 rounded-full select-none tabular-nums";
  const subtleClasses = subtle
    ? "text-gray-500 bg-gray-100/60 dark:bg-gray-800/60 opacity-75 transition-opacity"
    : "text-gray-600 bg-gray-100/80";

  const combinedClassName = `${baseClasses} ${subtleClasses} ${className}`.trim();

  return (
    <div
      className={combinedClassName}
      style={style}
      aria-label="Current time"
      title="Current device time (respects your timezone)"
    >
      {currentTime}
    </div>
  );
};

export default MilitaryTimeDisplay;
