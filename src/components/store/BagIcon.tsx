import type { SVGProps } from "react";

/** Shopping bag with an arched handle. */
export function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
      {...props}
    >
      <path d="M4.75 8.75h14.5l-.9 12.25H5.65z" />
      <path d="M8.75 11V7.25a3.25 3.25 0 0 1 6.5 0V11" />
    </svg>
  );
}
