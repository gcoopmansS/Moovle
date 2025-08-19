import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export function useSmoothNavigation() {
  const navigate = useNavigate();

  const smoothNavigate = useCallback(
    (to, options = {}) => {
      // Add smooth transition class to body
      document.body.style.transition = "opacity 0.2s ease-in-out";

      // Slight delay to prevent jarring transitions
      setTimeout(() => {
        navigate(to, {
          replace: true,
          ...options,
        });
      }, 50);
    },
    [navigate]
  );

  const navigateWithMessage = useCallback(
    (to, message, options = {}) => {
      smoothNavigate(to, {
        ...options,
        state: {
          ...options.state,
          message,
          timestamp: Date.now(),
        },
      });
    },
    [smoothNavigate]
  );

  return {
    smoothNavigate,
    navigateWithMessage,
  };
}
