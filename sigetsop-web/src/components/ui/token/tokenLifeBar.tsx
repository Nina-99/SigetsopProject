import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext, AuthContextType } from "../../../context";

const INACTIVITY_LIMIT = 600;

export const TokenLifeBar = () => {
  const auth = useContext<AuthContextType | null>(AuthContext);

  const [progress, setProgress] = useState(100);
  const lastActivity = useRef(Date.now() / 1000);

  const resetTimer = () => {
    lastActivity.current = Date.now() / 1000;
    setProgress(100);
  };

  useEffect(() => {
    if (!auth) return;

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer));

    const interval = setInterval(() => {
      const now = Date.now() / 1000;
      // const remaining = user.exp - now;
      const elapsed = now - lastActivity.current;
      const pct = Math.max(
        0,
        ((INACTIVITY_LIMIT - elapsed) / INACTIVITY_LIMIT) * 100,
      );
      setProgress(pct);
      if (elapsed >= INACTIVITY_LIMIT) {
        auth.logout();
      }
    }, 500);
    return () => {
      clearInterval(interval);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [auth]);

  return (
    <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded">
      <div
        className="h-full bg-orange-500 rounded transition-all"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default TokenLifeBar;
