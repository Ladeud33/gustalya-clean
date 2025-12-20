import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-8 backdrop-blur-sm">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Gustalya. All rights reserved.
        </p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Cuisiné avec</span>
          <Heart className="h-4 w-4 fill-red-500 text-red-500 animate-pulse-slow" />
          <span>par Gustalya Team</span>
        </div>
      </div>
    </footer>
  );
}
