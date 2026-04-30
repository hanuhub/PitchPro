import React from "react";

/**
 * PitchPro logo image. Tinted via CSS `--logo-filter` (theme-aware).
 * Variants:
 *   icon — badge only (square-ish), good for navbar
 *   wordmark — full logo with "PITCHPRO" text below the badge
 */
export function Logo({ variant = "icon", className = "", testId, ...rest }) {
  const src = variant === "wordmark"
    ? "/brand/pitchpro-logo.png"
    : "/brand/pitchpro-icon.png";
  return (
    <img
      src={src}
      alt="PitchPro"
      className={`logo-tinted ${className}`}
      data-testid={testId || `logo-${variant}`}
      {...rest}
    />
  );
}
