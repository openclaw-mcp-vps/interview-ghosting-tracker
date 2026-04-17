"use client";

import Script from "next/script";
import type { ReactNode } from "react";

type LemonCheckoutButtonProps = {
  checkoutUrl: string;
  className?: string;
  children: ReactNode;
};

export function LemonCheckoutButton({ checkoutUrl, className, children }: LemonCheckoutButtonProps) {
  const disabled = checkoutUrl === "#";

  return (
    <>
      <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="afterInteractive" />
      <a
        href={checkoutUrl}
        className={className}
        data-lemonsqueezy="true"
        aria-disabled={disabled}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
          }
        }}
      >
        {disabled ? "Set Lemon Squeezy env vars to enable checkout" : children}
      </a>
    </>
  );
}
