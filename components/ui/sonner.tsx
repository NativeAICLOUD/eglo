"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Same toast setup as the NativeHome apps (shadcn/ui Sonner wrapper); EGLO has no dark
// mode, so the theme is fixed to light instead of coming from next-themes.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:shadow-lg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
