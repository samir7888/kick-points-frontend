"use client";

import type { ButtonProps } from "@/components/ui";
import { Button } from "@/components/ui";

type KickAuthButtonProps = {
  nextPath?: string;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

function safeNextPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

export function KickAuthButton({
  nextPath = "/dashboard",
  label,
  variant,
  size,
  className
}: KickAuthButtonProps) {
  const destination = safeNextPath(nextPath);

  function startSignIn() {
    window.location.assign(`/api/v1/auth/kick/login?next=${encodeURIComponent(destination)}`);
  }

  const buttonLabel = label ?? "Continue with Kick";

  return (
    <Button type="button" variant={variant} size={size} className={className} onClick={startSignIn}>
      {buttonLabel}
    </Button>
  );
}
