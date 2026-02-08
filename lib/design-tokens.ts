/**
 * Design system tokens — use with Tailwind.
 * Spacing, padding, radii are applied via Tailwind classes; this file documents scale.
 *
 * Spacing: 4, 5, 6 (cards p-5/p-6), tables p-4
 * Radii: rounded-2xl (cards), rounded-xl (buttons, inputs)
 * Transitions: duration-150, duration-200
 */

export const TOKENS = {
  spacing: {
    card: "p-5 sm:p-6",
    table: "p-4",
    page: "px-4 py-8 sm:px-6 lg:px-8",
  },
  radius: {
    card: "rounded-2xl",
    button: "rounded-xl",
    input: "rounded-xl",
  },
  transition: "transition-all duration-150",
  transitionSlow: "transition-all duration-200",
} as const
