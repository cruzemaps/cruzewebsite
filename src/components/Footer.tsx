import { Twitter, Linkedin, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">C</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">Cruze</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Press</a>
            <a href="#" className="hover:text-foreground transition-colors">Careers</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Github className="w-5 h-5 text-muted-foreground hover:text-primary" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/30 text-center text-sm text-muted-foreground">
          © 2026 Cruze Technologies. Dissolving traffic, one driver at a time.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
