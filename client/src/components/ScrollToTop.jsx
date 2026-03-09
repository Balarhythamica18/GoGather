import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Core window scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // 2. Document level fallback
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // 3. Target specific layout containers that might have internal scrolls
    const scrollContainers = [
      '.admin-layout__content',
      '.organizer-main-content',
      '.main-content',
      'main'
    ];
    
    scrollContainers.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) el.scrollTop = 0;
    });

  }, [pathname]);

  return null;
};

export default ScrollToTop;
