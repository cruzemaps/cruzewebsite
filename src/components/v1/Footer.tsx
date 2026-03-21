import { Twitter, Linkedin, Github } from "lucide-react";

// Mock Badges (Use real SVGs in production)
const AppStoreBadge = ({ className }: { className?: string }) => (
  <div className={`bg-white border border-white/10 text-black h-12 px-4 rounded-lg flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity ${className}`}>
    <svg viewBox="0 0 384 512" fill="currentColor" className="w-6 h-6">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
    </svg>
    <div className="flex flex-col items-start leading-none">
      <span className="text-[10px] font-medium">Download on the</span>
      <span className="text-base font-bold">App Store</span>
    </div>
  </div>
);

const GooglePlayBadge = ({ className }: { className?: string }) => (
  <div className={`bg-white border border-white/10 text-black h-12 px-4 rounded-lg flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity ${className}`}>
    <svg viewBox="0 0 512 512" fill="currentColor" className="w-6 h-6">
      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </svg>
    <div className="flex flex-col items-start leading-none">
      <span className="text-[10px] font-bold uppercase">Get it on</span>
      <span className="text-base font-bold">Google Play</span>
    </div>
  </div>
);


const Footer = () => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="py-12 border-t border-border/50 bg-background/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
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
            <p className="text-sm text-muted-foreground mb-6">
              A smarter way to drive differently, together. Stop traffic jams before they start.
            </p>
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

          {/* Links */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold text-foreground mb-4">Features</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">Live Lab</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Savings</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Rewards</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Company</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Partners</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Download */}
          <div className="md:col-span-1">
            <h3 className="font-semibold text-foreground mb-4">Download the App</h3>
            <div className="flex flex-col gap-3">
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/30 text-center md:text-left text-sm text-muted-foreground">
          © 2026 Cruze Technologies. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
