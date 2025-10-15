import { cn } from "@/lib/utils";

// Admin header links - focused on shop management
const links = [
  { href: "/admin", label: "Shop Listings" },
  { href: "/", label: "View Site", target: "_blank" },
];

export function Header({ currentPath }: { currentPath: string }) {
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6 mx-6 h-16">
      <a href="/admin" className="text-sm font-bold leading-none text-foreground">
        Producer Admin
      </a>
      {links.map((link) => (
        <a
          className={cn(
            "text-sm font-medium leading-none transition-colors hover:text-primary",
            currentPath === link.href || (link.href === "/admin" && currentPath.startsWith("/admin"))
              ? "text-foreground"
              : "text-muted-foreground",
          )}
          href={link.href}
          target={link.target}
          aria-current={currentPath === link.href ? "page" : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
