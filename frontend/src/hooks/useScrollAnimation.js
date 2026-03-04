import { useInView } from 'react-intersection-observer';

/**
 * Custom hook for scroll-triggered animations
 * @param {Object} options - Intersection observer options
 * @returns {Object} - { ref, isInView }
 */
export const useScrollAnimation = (options = {}) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    ...options
  });

  return { ref, isInView: inView };
};

export default useScrollAnimation;
