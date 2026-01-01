import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Automatically scrolls to the top of the page whenever the route changes.
 * Uses smooth scrolling behavior for a professional, fluid navigation experience.
 * This ensures users always start at the top when navigating to a new page.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;

