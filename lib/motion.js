// Shared animation primitives — kept in one place so motion stays
// consistent (and restrained) across the app instead of ad-hoc per page.

export const EASE = [0.16, 1, 0.3, 1] // smooth deceleration, no bounce

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

export const stagger = (delayChildren = 0.05, staggerChildren = 0.06) => ({
  hidden: {},
  show: {
    transition: { delayChildren, staggerChildren },
  },
})

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
}
