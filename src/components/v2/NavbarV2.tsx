import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";

const NavbarV2 = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex items-center h-20">
          {/* Logo Container - Left */}
          <div className="flex-1 flex justify-start">
            <a href="/#/v2" className="flex items-center gap-3">
              <span className="font-display font-bold text-2xl text-white tracking-wide">
                CRUZE
              </span>
            </a>
          </div>

          {/* Nav Links - Center */}
          <div className="hidden md:flex flex-none items-center gap-8 px-4">
            <div className="relative group cursor-pointer flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-medium tracking-wide">
              Solutions <ChevronDown size={14} />
              {/* Dropdown placeholder */}
              <div className="absolute top-full mt-2 left-0 w-48 bg-[#0B0E14] border border-white/10 rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <a className="block px-4 py-2 text-sm text-white/70 hover:text-brand-orange hover:bg-white/5 rounded-md" href="#">Logistics & Fleets</a>
                <a className="block px-4 py-2 text-sm text-white/70 hover:text-brand-orange hover:bg-white/5 rounded-md" href="#">Smart Cities</a>
                <a className="block px-4 py-2 text-sm text-white/70 hover:text-brand-orange hover:bg-white/5 rounded-md" href="#">Individual Drivers</a>
              </div>
            </div>
            
            <a href="#" className="text-white/80 hover:text-white transition-colors text-sm font-medium tracking-wide">
              Technology
            </a>
            
            <a href="#" className="text-white/80 hover:text-white transition-colors text-sm font-medium tracking-wide">
              Resources
            </a>
          </div>

          {/* CTA Container - Right */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" className="text-white hover:text-brand-orange hover:bg-transparent tracking-wide">
                Login
              </Button>
              <Button className="bg-brand-orange hover:bg-brand-orange/90 text-[#0B0E14] font-bold tracking-wide rounded-full px-6">
                Book a Demo
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarV2;
