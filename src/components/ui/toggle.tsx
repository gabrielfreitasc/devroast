"use client";

import { Switch } from "@base-ui-components/react/switch";
import { tv } from "tailwind-variants";

const wrapper = tv({
  base: "inline-flex items-center gap-3",
});

const track = tv({
  base: [
    "flex items-center rounded-full w-10 h-[22px] p-[3px] cursor-pointer",
    "transition-colors duration-150",
    "bg-border-primary justify-start",
    "data-[checked]:bg-accent-green data-[checked]:justify-end",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
  ],
});

const thumb = tv({
  base: [
    "size-4 rounded-full transition-all duration-150",
    "bg-text-secondary",
    "data-[checked]:bg-bg-page",
  ],
});

const labelStyle = tv({
  base: "text-xs text-text-secondary transition-colors duration-150",
});

type ToggleProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function Toggle({
  checked,
  defaultChecked,
  label,
  onChange,
  disabled,
  className,
}: ToggleProps) {
  return (
    <div className={wrapper({ className })}>
      <Switch.Root
        className={track()}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onChange}
        disabled={disabled}
      >
        <Switch.Thumb className={thumb()} />
      </Switch.Root>
      {label && <span className={labelStyle()}>{label}</span>}
    </div>
  );
}
