import { ChefHat, Timer, Menu } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md dark:bg-black/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/">
          <a className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-cooking text-white shadow-cooking">
              <ChefHat className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">
                Gustalya
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Intelligent Timer
              </span>
            </div>
          </a>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/">
            <a className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Timers
            </a>
          </Link>
          <button className="rounded-full bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20">
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </header>
  );
}
