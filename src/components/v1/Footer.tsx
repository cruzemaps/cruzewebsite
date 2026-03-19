import { Twitter, Linkedin, Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="py-12 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Cruze Logo"
                className="h-12 w-auto object-contain"
              />
              <span className="font-display font-bold text-xl text-foreground">Cruze</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transforming traffic through swarm intelligence.
            </p>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#benefits"
                      onClick={(e) => scrollToSection(e, "benefits")}
                      className="hover:text-foreground transition-colors"
                    >
                      Benefits
                    </a>
                  </li>
                  <li>
                    <a
                      href="#how-it-works"
                      onClick={(e) => scrollToSection(e, "how-it-works")}
                      className="hover:text-foreground transition-colors"
                    >
                      How It Works
                    </a>
                  </li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Press</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Contact</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="mailto:contact@cruze.com" className="hover:text-foreground transition-colors">Email</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email Sign-up */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-foreground mb-3">Stay Updated</h3>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="flex-1"
              />
              <Button variant="hero" size="sm">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2026 Cruze Technologies. All rights reserved.
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
      </div>
    </footer>
  );
};

export default Footer;
