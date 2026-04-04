import { type ComponentProps } from "react";
import Link from "next/link";
import { tv } from "tailwind-variants";

const navbar = tv({
  base: "flex items-center justify-between h-14 px-6 border-b border-border-primary w-full",
});

type NavbarProps = ComponentProps<"nav"> & {
  children?: React.ReactNode;
};

export function Navbar({ className, children, ...props }: NavbarProps) {
  return (
    <nav className={navbar({ className })} {...props}>
      <NavbarLogo />
      {children}
    </nav>
  );
}

export function NavbarLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-accent-green text-2xl font-bold">&gt;</span>
      <span className="text-text-primary text-xl font-medium">devroast</span>
    </Link>
  );
}

type NavbarLinkProps = ComponentProps<"a">;

export function NavbarLink({ className, children, ...props }: NavbarLinkProps) {
  return (
    <a
      className={tv({
        base: "text-text-secondary text-sm hover:text-text-primary transition-colors duration-150 cursor-pointer flex items-center gap-2 group",
      })({ className })}
      {...props}
    >
      {children}
    </a>
  );
}
