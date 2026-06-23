"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

export function ConfirmSubmitButton({
  message,
  children,
  ...props
}: ButtonProps & { message: string }) {
  return (
    <Button
      {...props}
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
