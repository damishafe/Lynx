<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Lynx UI/UX & Architecture Specification

## AI Developer Instructions (Read First)

You are an expert Frontend Architect building "Lynx," an enterprise-grade multi-unit operations dashboard. Your goal is to write React 19 / Next.js Server Components that look institutional, highly polished, and custom-built.

**ABSOLUTELY NO GENERIC UI.** Do not use default Tailwind shadows, generic gray borders, or standard 4px border radii. Adhere strictly to the "Soft Bento" aesthetic defined below. Every component must be highly reusable, utilizing composition and `tailwind-merge`.

---

## 1. The "Anti-Generic" Design Manifesto

To ensure Lynx looks like a $99/mo premium SaaS, you must enforce the following visual rules:

- **The Radius Rule:** Everything is exceptionally round. Cards use `rounded-[2rem]` (32px). Buttons and pills use `rounded-full`. Never use `rounded-md` or `rounded-lg`.
- **The Contrast Rule:** Avoid "medium" grays for surfaces. The app relies on stark contrast: either pristine white (`bg-white`), ultra-light gray backgrounds (`bg-[#F3F4F6]`), or pitch-black accent cards (`bg-[#09090B]`).
- **The Shadow Rule:** Default Tailwind shadows (`shadow-md`, `shadow-lg`) look generic and dirty. You must use our custom optical shadows. Shadows should be wide, highly diffused, and very low opacity.
- **The Border Rule:** Borders should be practically invisible. Use `border border-gray-100` or `border-white/10` (on dark elements). Never use harsh `border-gray-300`.

---

## 2. Core Design Tokens (Tailwind)

Always use these specific utility classes over default Tailwind values.

### Shadows (The "Optical" Look)

When a card needs elevation, use these exact arbitrary values to create a "floating" effect rather than a "drop shadow" effect.

- **Subtle Card Hover:** `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`
- **Floating Elements (Dropdowns, Modals):** `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`
- **Glow Effects (Colored):** `shadow-[0_0_40px_-10px_rgba(34,197,94,0.2)]` (swap RGB for brand colors)

### Typography

- **Font:** `font-sans` (configured to **Satoshi**).
- **Headings:** Must always be `tracking-tight` and `text-zinc-900`.
- **Secondary Text:** Use `text-gray-500` and `font-medium`. Never use pure black for body text.

---

## 3. Component Architecture & Reusability

All UI components must be built for strict reusability. Follow these absolute rules:

### A. The `cn()` Utility is Mandatory

Every reusable component MUST accept a `className` prop and merge it properly using `clsx` and `tailwind-merge`.

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### B. Composition Over Configuration (Slots / Children)

Do not pass excessive props like `headerText`, `footerText`. Pass `children`. Build compound components if necessary.

🚫 **BAD (Generic & Brittle):**

```tsx
<Card title="Net Profit" content="$4,000" buttonText="View" />
```

✅ **GOOD (Reusable & Composable):**

```tsx
<BentoCard className="col-span-2">
  <BentoCardHeader>
    <BentoCardTitle>Net Profit</BentoCardTitle>
  </BentoCardHeader>
  <BentoCardContent className="text-4xl font-semibold">
    $4,000
  </BentoCardContent>
</BentoCard>
```

### C. Server Components by Default

Always assume a component is a React Server Component (RSC) unless it needs state (`useState`), effects (`useEffect`), or event listeners (`onClick`).

Only add `"use client"` at the absolute leaf nodes (e.g., the specific `Button` component, or a specific toggle switch).

---

## 4. Blueprint: The `BentoCard` Component

This is the foundational building block of the Lynx UI. AI, use this exact pattern when generating cards.

```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const BentoCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "inverted" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[2rem] p-6 sm:p-8 transition-all duration-300",
      // Variant logic for the signature high-contrast look
      variant === "default"
        ? "bg-white text-zinc-950 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100"
        : "bg-[#09090B] text-white shadow-xl",
      className
    )}
    {...props}
  />
))
BentoCard.displayName = "BentoCard"

const BentoCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
))
BentoCardHeader.displayName = "BentoCardHeader"

const BentoCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold tracking-tight",
      className
    )}
    {...props}
  />
))
BentoCardTitle.displayName = "BentoCardTitle"

export { BentoCard, BentoCardHeader, BentoCardTitle }
```

---

## 5. UI Element Patterns

### Buttons

Buttons must look substantial and highly tactile.

- **Primary:** `bg-[#09090B] text-white rounded-full px-6 py-2.5 font-medium hover:bg-zinc-800 hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-all`
- **Secondary:** `bg-white border border-gray-200 text-zinc-900 rounded-full px-6 py-2.5 font-medium hover:bg-gray-50`

### Status Pills (Unit States)

Use soft, desaturated backgrounds with highly saturated text. Never use harsh, pure colors.

- **Ready:** `bg-emerald-50 text-emerald-700 border border-emerald-100/50`
- **Occupied:** `bg-amber-50 text-amber-700 border border-amber-100/50`
- **Maintenance:** `bg-rose-50 text-rose-700 border border-rose-100/50`

### Icons (Hugeicons)

Never let an icon float on its own. Always encapsulate it in a rounded square to maintain the bento aesthetic.

- **Icon Wrapper:** `flex items-center justify-center w-12 h-12 rounded-[1rem] bg-gray-50 text-zinc-900`

---

## 6. Execution Command

AI, when asked to build a page or component, you must:

1. Wrap layouts in `min-h-screen bg-[#F3F4F6] p-4 sm:p-8`.
2. Use CSS Grid with gap `gap-6` or `gap-8`.
3. Construct the UI using the `BentoCard` and strict typography rules defined above.
4. Never invent new shadow values; use the optical shadows from Section 2.
