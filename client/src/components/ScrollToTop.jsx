import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the main window immediately
    window.scrollTo(0, 0);

    // Also reset potential scroll containers in dashboard layouts
    const containers = document.querySelectorAll('.admin-layout__content, .organizer-main-content, main');
    containers.forEach(container => {
      container.scrollTo(0, 0);
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
