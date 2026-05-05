import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const NavbarV2 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0E14]/80 backdrop-blur-xl border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex items-center h-20">
          {/* Logo Container - Left */}
          <div className="flex-1 flex justify-start">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Cruze Logo" className="h-10 w-auto" />
              <span className="font-display font-bold text-2xl text-white tracking-wide">
                CRUZE
              </span>
            </Link>
          </div>

          {/* Nav Links - Center */}
          <div className="hidden md:flex flex-none items-center gap-8 px-4">
            <div className="relative group cursor-pointer flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-medium tracking-wide">
              Solutions <ChevronDown size={14} />
              {/* Dropdown */}
              <div className="absolute top-full mt-2 left-0 w-56 bg-[#0B0E14] border border-white/10 rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link className="block px-4 py-2 text-sm text-white/70 hover:text-brand-orange hover:bg-white/5 rounded-md" to="/for-fleets">
                  For Fleets
                </Link>
                <Link className="block px-4 py-2 text-sm text-white/70 hover:text-brand-orange hover:bg-white/5 rounded-md" to="/for-cities">
                  For Cities & DOTs
                </Link>
                <Link className="block px-4 py-2 text-sm text-white/70 hover:text-brand-orange hover:bg-white/5 rounded-md" to="/route-planner">
                  Route Planner
                </Link>
                <Link className="block px-4 py-2 text-sm text-white/70 hover:text-brand-orange hover:bg-white/5 rounded-md" to="/cameras">
                  Live Cameras
                </Link>
                <Link className="block px-4 py-2 text-sm text-white/70 hover:text-brand-orange hover:bg-white/5 rounded-md" to="/case-studies">
                  Case Studies
                </Link>
              </div>
            </div>
            
            <Link to="/insights" className="text-white/80 hover:text-white transition-colors text-sm font-medium tracking-wide">
              Insights
            </Link>

            <Link to="/investors" className="text-white/80 hover:text-white transition-colors text-sm font-medium tracking-wide">
              Investors
            </Link>
          </div>


          {/* CTA Container - Right */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="relative group cursor-pointer flex items-center">
                  <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-white hover:text-brand-cyan hover:bg-transparent tracking-wide gap-2">
                    <UserIcon size={16} /> Dashboard
                  </Button>
                  <div className="absolute top-full mt-2 right-0 w-40 bg-[#0B0E14] border border-white/10 rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button 
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-sm text-white/70 hover:text-brand-orange hover:bg-white/5 rounded-md"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => navigate("/login")} className="text-white hover:text-brand-orange hover:bg-transparent tracking-wide">
                  Login
                </Button>
              )}
              <Button onClick={() => navigate('/login')} className="bg-brand-orange hover:bg-brand-orange/90 text-[#0B0E14] font-bold tracking-wide rounded-full px-6">
                Start the Pilot
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

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#0B0E14] border-b border-white/10 px-6 py-4 flex flex-col gap-4 shadow-xl">
             <Link to="/for-fleets" className="text-white/80 hover:text-white font-medium" onClick={() => setIsOpen(false)}>For Fleets</Link>
             <Link to="/for-cities" className="text-white/80 hover:text-white font-medium" onClick={() => setIsOpen(false)}>For Cities</Link>
             <Link to="/route-planner" className="text-white/80 hover:text-white font-medium" onClick={() => setIsOpen(false)}>Route Planner</Link>
             <Link to="/cameras" className="text-white/80 hover:text-white font-medium" onClick={() => setIsOpen(false)}>Live Cameras</Link>
             <Link to="/case-studies" className="text-white/80 hover:text-white font-medium" onClick={() => setIsOpen(false)}>Case Studies</Link>
             <Link to="/insights" className="text-white/80 hover:text-white font-medium" onClick={() => setIsOpen(false)}>Insights</Link>
             <Link to="/investors" className="text-white/80 hover:text-white font-medium" onClick={() => setIsOpen(false)}>Investors</Link>
             {user ? (

               <button 
                 onClick={() => { 
                   localStorage.removeItem("demo_role");
                   localStorage.removeItem("demo_status");
                   signOut(); 
                   setIsOpen(false); 
                 }} 
                 className="text-left text-brand-orange hover:text-white font-medium"
               >
                 Sign Out
               </button>
             ) : (
               <Link to="/login" className="text-brand-cyan hover:text-white font-medium" onClick={() => setIsOpen(false)}>Login</Link>
             )}
             <Button onClick={() => { navigate('/login'); setIsOpen(false); }} className="bg-brand-orange text-[#0B0E14] font-bold w-full rounded-full">
               Start the Pilot
             </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavbarV2;
