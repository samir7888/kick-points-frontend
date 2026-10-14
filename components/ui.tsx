"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

export function cn(...values: ClassValue[]) { return twMerge(clsx(values)); }
const buttonStyles = cva("inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50", {
  variants: { variant: { primary: "bg-brand text-brand-foreground hover:brightness-110", secondary: "border border-border bg-surface text-foreground hover:bg-muted", ghost: "text-foreground hover:bg-muted", danger: "bg-loss text-white hover:brightness-110" }, size: { sm: "min-h-8 px-3 text-xs", lg: "min-h-12 px-5" } },
  defaultVariants: { variant: "primary", size: "sm" }
});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> { asChild?: boolean; }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn("h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none", className)} {...props} />);
Input.displayName = "Input";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <section className={cn("rounded-2xl border border-border bg-surface", className)} {...props} />; }
export function Badge({ children, className }: { children: React.ReactNode; className?: string }) { return <span className={cn("inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground", className)}>{children}</span>; }
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) { return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50", checked ? "bg-brand hover:brightness-110" : "bg-muted-foreground/70 hover:brightness-95")}><span className={cn("absolute left-0 top-1 h-4 w-4 rounded-full transition-transform", checked ? "translate-x-6 bg-brand-foreground" : "translate-x-1 bg-white")} /></button>; }
export function Empty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) { return <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center"><p className="font-display text-lg font-semibold">{title}</p><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>; }
export function Loading({ label = "Loading" }: { label?: string }) { return <div className="grid min-h-36 place-items-center rounded-2xl border border-border bg-surface text-sm text-muted-foreground" role="status">{label}…</div>; }

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-70" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-surface text-foreground shadow-float",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center">
        <ChevronUp className="h-4 w-4" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center">
        <ChevronDown className="h-4 w-4" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectLabel = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectSeparator = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
