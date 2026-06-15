import { useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

export const useCurrentTime = () => {
  const { isMilitaryTime } = useSettings();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    // Update the time every minute
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  let formattedTime: string;
  if (isMilitaryTime) {
    // Always produce 24-hour military time with leading zero (e.g. 06:05, 18:30)
    const hours = currentTime.getHours().toString().padStart(2, "0");
    const minutes = currentTime.getMinutes().toString().padStart(2, "0");
    formattedTime = `${hours}:${minutes}`;
  } else {
    formattedTime = new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(currentTime);
  }

  return formattedTime;
};
