import NavbarV2 from "@/components/v2/NavbarV2";
import { Link } from "react-router-dom";
import { Twitter, Linkedin, Mail } from "lucide-react";

type Props = { children: React.ReactNode };

export default function MarketingLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-brand-charcoal text-white font-body selection:bg-brand-cyan/30 flex flex-col">
      <NavbarV2 />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070A10] mt-24">
      <div className="container mx-auto px-6 py-12 grid md:grid-cols-6 gap-10 text-sm">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="Cruze" className="h-8 w-auto" />
            <span className="font-display font-bold text-xl">CRUZE</span>
          </Link>
          <p className="text-white/60 max-w-sm">
            Coordinating driver speeds with swarm intelligence and physics-informed AI to dissolve phantom traffic jams before they form.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="https://twitter.com/cruzemaps" aria-label="Twitter" className="p-2 rounded-md hover:bg-white/5 text-white/60 hover:text-white">
              <Twitter size={16} />
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn" className="p-2 rounded-md hover:bg-white/5 text-white/60 hover:text-white">
              <Linkedin size={16} />
            </a>
            <a href="mailto:hello@cruzemaps.com" aria-label="Email" className="p-2 rounded-md hover:bg-white/5 text-white/60 hover:text-white">
              <Mail size={16} />
            </a>
          </div>
        </div>

        <FooterColumn title="Product">
          <FooterLink to="/for-fleets">For Fleets</FooterLink>
          <FooterLink to="/for-cities">For Cities</FooterLink>
          <FooterLink to="/route-planner">Route Planner</FooterLink>
          <FooterLink to="/cameras">Live Cameras</FooterLink>
          <FooterLink to="/apply">Apply for Pilot</FooterLink>
          <FooterLink to="/stats">Live Impact</FooterLink>
        </FooterColumn>

        <FooterColumn title="Coverage">
          <FooterLink to="/cities">Pilot Cities</FooterLink>
          <FooterLink to="/lanes">Top US Lanes</FooterLink>
          <FooterLink to="/case-studies">Case Studies</FooterLink>
          <FooterLink to="/insights">Insights</FooterLink>
          <FooterLink to="/faq">FAQ</FooterLink>
          <FooterLink to="/press">Press Kit</FooterLink>
        </FooterColumn>

        <FooterColumn title="Company">
          <FooterLink to="/investors">Investors</FooterLink>
          <FooterLink to="/login">Sign In</FooterLink>
          <a href="mailto:hello@cruzemaps.com" className="text-white/60 hover:text-white">Contact</a>
        </FooterColumn>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Cruzemaps. Driving the future of traffic management.
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-display font-semibold text-white mb-3 text-xs uppercase tracking-widest">{title}</h4>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-white/60 hover:text-white">
      {children}
    </Link>
  );
}
