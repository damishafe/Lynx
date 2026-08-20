"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

import { Input, type InputProps } from "./input";

type PasswordInputProps = Omit<InputProps, "type" | "trailing">;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [shown, setShown] = React.useState(false);
    return (
      <Input
        ref={ref}
        type={shown ? "text" : "password"}
        trailing={
          <button
            type="button"
            aria-label={shown ? "Hide password" : "Show password"}
            onClick={() => setShown((s) => !s)}
            className="cursor-pointer flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:text-zinc-700 hover:bg-gray-100 transition-colors"
          >
            <HugeiconsIcon
              icon={shown ? ViewOffIcon : ViewIcon}
              size={16}
              strokeWidth={2}
            />
          </button>
        }
        {...props}
      />
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
