import { useEffect } from "react";
import throttle from "lodash.throttle";

export const WINDOW_RESIZE_THROTTLE_WAIT = 250;

// See: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
export function useUniversalVhUnit() {
  useEffect(() => {
    const updateViewportHeightUnit = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    const throttledResizeHandler = throttle(
      updateViewportHeightUnit,
      WINDOW_RESIZE_THROTTLE_WAIT
    );

    throttledResizeHandler();

    window.addEventListener("resize", throttledResizeHandler);

    return () => {
      window.removeEventListener("resize", throttledResizeHandler);
    };
  }, []);
}
