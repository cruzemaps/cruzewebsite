import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Navigation, 
  Zap, 
  Timer,
  Plus,
  Trash2,
  Maximize2,
  TrafficCone,
  Gauge,
  Variable,
  Search,
  Mic,
  AlertTriangle,
  Map as MapIcon,
  User,
  MoreVertical,
  X,
  Compass,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type ComponentType = 'signal' | 'speedometer' | 'suggested' | 'eta' | 'swarm' | 'hazard' | 'route' | 'voice';

interface DraggableItem {
    id: string;
    type: ComponentType;
    x: number;
    y: number;
    width: number;
    height: number;
}

// --- Draggable & Resizable Wrapper ---
const DraggableResizable = ({ 
    item, 
    onUpdate, 
    onDelete, 
    children 
}: { 
    item: DraggableItem; 
    onUpdate: (id: string, updates: Partial<DraggableItem>) => void;
    onDelete: (id: string) => void;
    children: React.ReactNode;
}) => {
    const [isResizing, setIsResizing] = useState(false);

    const handleResize = (e: React.PointerEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = item.width;
        const startHeight = item.height;

        const onPointerMove = (moveEvent: PointerEvent) => {
            const newWidth = Math.max(120, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(100, startHeight + (moveEvent.clientY - startY));
            onUpdate(item.id, { width: newWidth, height: newHeight });
        };

        const onPointerUp = () => {
            setIsResizing(false);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragEnd={(_, info) => {
                onUpdate(item.id, { x: item.x + info.offset.x, y: item.y + info.offset.y });
            }}
            whileDrag={{ scale: 1.02, zIndex: 100 }}
            style={{ 
                position: 'absolute', 
                left: item.x, 
                top: item.y, 
                width: item.width, 
                height: item.height,
            }}
            className="group cursor-grab active:cursor-grabbing"
        >
            <div className={`w-full h-full bg-[#131821]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-5 shadow-2xl relative overflow-hidden transition-shadow ${isResizing ? 'shadow-brand-orange/20 ring-1 ring-brand-orange/30' : 'hover:shadow-white/10 hover:ring-1 hover:ring-white/20'}`}>
                {children}

                {/* Controls Overlay */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Resize Handle */}
                <div 
                    onPointerDown={handleResize}
                    className="absolute bottom-3 right-3 cursor-nwse-resize p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Maximize2 className="w-4 h-4 text-white/20 hover:text-white" />
                </div>
            </div>
        </motion.div>
    );
};

// --- Specialized Components ---

const SignalLight = ({ state = 'green' }: { state?: 'red' | 'yellow' | 'green' }) => (
    <div className="flex flex-col items-center justify-center h-full gap-4 pt-4">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Signal_Link</label>
        <div className="flex flex-col gap-3 p-4 bg-black/40 rounded-full border border-white/5">
            <div className={`w-9 h-9 rounded-full ${state === 'red' ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-red-500/10'}`} />
            <div className={`w-9 h-9 rounded-full ${state === 'yellow' ? 'bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]' : 'bg-yellow-500/10'}`} />
            <div className={`w-9 h-9 rounded-full ${state === 'green' ? 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'bg-green-500/10'}`} />
        </div>
    </div>
);

const Speedometer = ({ value = 65 }: { value?: number }) => (
    <div className="flex flex-col items-center justify-center h-full pt-4">
        <div className="relative w-full aspect-square flex items-center justify-center max-w-[160px]">
            <svg className="w-full h-full -rotate-[220deg]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeDasharray="260 360" strokeLinecap="round" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="#FF8C00" strokeWidth="8" strokeDasharray={`${(value / 120) * 260} 360`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-4xl font-display font-bold tabular-nums text-white">{value}</span>
                <span className="text-[10px] text-white/30 uppercase font-mono tracking-widest">MPH</span>
            </div>
        </div>
    </div>
);

const SuggestedSpeed = ({ value = 42 }: { value?: number }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Badge variant="outline" className="border-brand-cyan/30 text-brand-cyan text-[9px] px-2 py-0 h-4 bg-brand-cyan/5 mb-4 uppercase tracking-[0.2em]">Pacing_Target</Badge>
        <div className="flex items-baseline gap-1">
            <span className="text-6xl font-display font-bold text-white tracking-tighter tabular-nums">{value}</span>
            <span className="text-sm font-bold text-brand-cyan/50 tracking-widest font-mono">CRZ</span>
        </div>
        <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
             <motion.div 
                animate={{ x: ["-100%", "100%"] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-brand-cyan/40" 
             />
        </div>
    </div>
);

const HazardAlert = () => (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
            <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
            <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">CONGESTION AHEAD</p>
            <p className="text-[10px] text-white/40 font-mono">0.8 KM • +4m DELAY</p>
        </div>
        <Button variant="outline" className="h-8 text-[10px] font-bold border-white/5 hover:bg-white/5 rounded-xl uppercase">Confirm View</Button>
    </div>
);

const RouteChoice = () => (
    <div className="flex flex-col justify-center h-full p-2 space-y-4">
         <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-2">Path Selection</p>
         <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-between cursor-pointer">
                <div>
                   <p className="text-xs font-bold text-brand-orange">CRUZE_FAST</p>
                   <p className="text-[9px] text-white/40">14:52 • 12.4m SAVED</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-brand-orange flex items-center justify-center">
                   <div className="w-2 h-2 rounded-full bg-black" />
                </div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer opacity-50">
                <div>
                   <p className="text-xs font-bold text-white">STANDARD</p>
                   <p className="text-[9px] text-white/40">15:05 • 0m SAVED</p>
                </div>
                <div className="w-5 h-5 rounded-full border border-white/10" />
            </div>
         </div>
    </div>
);

// --- City Map Background ---
const CityMap = () => (
    <div className="absolute inset-0 z-0">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
            <defs>
                <pattern id="roadPattern" width="100" height="100" patternUnits="userSpaceOnUse">
                    <rect width="100" height="100" fill="#07090D" />
                    <path d="M 0 50 L 100 50 M 50 0 L 50 100" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#roadPattern)" />
            
            {/* Roads */}
            <path d="M 100 0 L 100 1000 M 400 0 Q 400 300 700 300 L 1000 300 M 0 600 L 1000 600" stroke="rgba(255,255,255,0.1)" strokeWidth="40" fill="none" />
            
            {/* Cruze Swarm Path */}
            <motion.path 
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} 
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                d="M 100 800 L 400 600 L 700 300" 
                stroke="#FF8C00" strokeWidth="4" fill="none" className="opacity-30" 
            />
            
            {/* Hazards Visualized */}
            <circle cx="450" cy="550" r="40" fill="rgba(239,68,68,0.1)" />
            <circle cx="450" cy="550" r="15" fill="rgba(239,68,68,0.3)" className="animate-ping" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-[#0B0E14] opacity-80" />
    </div>
);

// --- Main Page ---

const UIInterns = () => {
    const [items, setItems] = useState<DraggableItem[]>([
        { id: '1', type: 'speedometer', x: 80, y: 150, width: 220, height: 220 },
        { id: '2', type: 'suggested', x: 320, y: 150, width: 260, height: 180 },
        { id: '3', type: 'route', x: 600, y: 150, width: 280, height: 220 }
    ]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const addItem = (type: ComponentType) => {
        const newItem: DraggableItem = {
            id: Date.now().toString(),
            type,
            x: 400 + Math.random() * 100,
            y: 400 + Math.random() * 100,
            width: type === 'speedometer' ? 220 : type === 'signal' ? 160 : type === 'route' ? 280 : 260,
            height: type === 'signal' ? 320 : type === 'route' ? 220 : 180
        };
        setItems([...items, newItem]);
    };

    const updateItem = (id: string, updates: Partial<DraggableItem>) => {
        setItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));
    };

    const deleteItem = (id: string) => {
        setItems(prev => prev.filter(it => it.id !== id));
    };

    return (
        <div className="h-screen w-screen bg-[#0B0E14] text-white overflow-hidden relative font-body selection:bg-brand-orange/30">
            <CityMap />

            {/* --- MAP APP ESSENTIALS --- */}
            
            {/* Top Bar: Search & Profile */}
            <div className="absolute top-8 left-8 right-8 z-50 flex items-center justify-between gap-6 pointer-events-none">
                <div className="flex items-center gap-6 pointer-events-auto">
                    <Link to="/" className="w-12 h-12 rounded-2xl bg-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20 hover:scale-105 transition-transform">
                        <Navigation className="w-6 h-6 text-black" />
                    </Link>
                    <div className="relative group">
                         <div className="absolute inset-y-0 left-4 flex items-center text-white/30 pointer-events-none">
                             <Search className="w-4 h-4" />
                         </div>
                         <Input 
                            placeholder="Where to?" 
                            className="w-80 md:w-[480px] h-12 rounded-2xl bg-[#131821]/80 backdrop-blur-xl border-white/10 pl-11 pr-12 focus:ring-1 focus:ring-brand-orange/50 transition-all shadow-2xl"
                         />
                         <div className="absolute inset-y-0 right-4 flex items-center pointer-events-auto">
                             <Mic className="w-4 h-4 text-brand-orange hover:text-white cursor-pointer transition-colors" />
                         </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                     <div className="flex flex-col items-end hidden md:block">
                         <p className="text-xs font-bold font-display tracking-tight">Anudeep B.</p>
                         <p className="text-[9px] font-mono text-brand-orange/60 tracking-widest uppercase">Elite Swarm_Pilot</p>
                     </div>
                     <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                         <User className="w-5 h-5 text-white/50" />
                     </div>
                </div>
            </div>

            {/* Quick Reporting FAB */}
            <div className="absolute top-24 left-8 z-50 pointer-events-auto">
                <motion.div 
                    initial={false}
                    animate={isMenuOpen ? "open" : "closed"}
                    className="relative"
                >
                    <Button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`w-12 h-12 rounded-2xl transition-all shadow-xl ${isMenuOpen ? 'bg-red-500 text-white' : 'bg-[#131821]/80 backdrop-blur-xl border border-white/10 text-white/50 hover:text-white'}`}
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </Button>
                    
                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="absolute left-16 top-0 bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 min-w-[160px] shadow-2xl"
                            >
                                {['Congestion', 'Police', 'Hazard', 'Swarm_Issue'].map(report => (
                                    <div key={report} className="px-4 py-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors flex items-center gap-3 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-orange opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{report}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* --- WORKBENCH TOOLBOX --- */}
            <div className="absolute inset-x-0 bottom-12 z-50 flex justify-center pointer-events-none">
                <motion.div 
                    drag dragMomentum={false}
                    className="pointer-events-auto bg-[#131821]/90 backdrop-blur-3xl border border-white/10 rounded-full py-2 px-3 flex items-center gap-2 shadow-2xl shadow-black/50"
                >
                    <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center mr-2 border border-brand-orange/20">
                        <Plus className="w-5 h-5 text-brand-orange" />
                    </div>
                    {[
                        { type: 'speedometer', icon: <Gauge className="w-4 h-4" />, label: 'Metric' },
                        { type: 'suggested', icon: <Variable className="w-4 h-4" />, label: 'Target' },
                        { type: 'signal', icon: <TrafficCone className="w-4 h-4" />, label: 'State' },
                        { type: 'hazard', icon: <AlertTriangle className="w-4 h-4" />, label: 'Alert' },
                        { type: 'route', icon: <Navigation className="w-4 h-4" />, label: 'Path' },
                    ].map(tool => (
                        <Button 
                            key={tool.type}
                            onClick={() => addItem(tool.type as any)}
                            variant="ghost" 
                            className="h-10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 px-4"
                        >
                            {tool.label}
                        </Button>
                    ))}
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    <Button 
                        variant="ghost" 
                        className="h-10 rounded-full text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 hover:bg-red-500/5 px-4"
                        onClick={() => setItems([])}
                    >
                        Reset
                    </Button>
                </motion.div>
            </div>

            {/* Environmental HUD (Bottom Right) */}
            <div className="absolute bottom-12 right-12 z-50 pointer-events-none flex flex-col items-end gap-3">
                 <div className="flex items-center gap-4 bg-[#131821]/60 backdrop-blur-md px-5 py-3 rounded-3xl border border-white/5">
                    <div className="text-right">
                        <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em] mb-1">Network_Load</p>
                        <p className="text-sm font-display font-bold">12.4 MB/S</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div>
                        <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em] mb-1">Sat_Link</p>
                        <div className="flex gap-0.5">
                             {[1, 2, 3, 4].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 3 ? 'bg-brand-orange' : 'bg-white/10'}`} />)}
                        </div>
                    </div>
                 </div>
                 <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mr-4">Maps_App_Prototype_Live</p>
            </div>

            {/* Canvas Stage */}
            <main className="absolute inset-0 z-10 p-12 overflow-hidden pointer-events-none">
                <div className="w-full h-full relative pointer-events-auto">
                    <AnimatePresence>
                        {items.map(item => (
                            <DraggableResizable
                                key={item.id}
                                item={item}
                                onUpdate={updateItem}
                                onDelete={deleteItem}
                            >
                                {item.type === 'speedometer' && <Speedometer />}
                                {item.type === 'suggested' && <SuggestedSpeed />}
                                {item.type === 'signal' && <SignalLight />}
                                {item.type === 'hazard' && <HazardAlert />}
                                {item.type === 'route' && <RouteChoice />}
                                {item.type === 'eta' && (
                                    <div className="flex flex-col justify-center h-full p-4">
                                        <div className="flex justify-between items-center mb-6">
                                            <Timer className="w-6 h-6 text-brand-orange" />
                                            <Badge variant="outline" className="text-[10px] border-white/10 font-bold">ARRIVAL</Badge>
                                        </div>
                                        <p className="text-5xl font-display font-bold text-white tabular-nums">14:52</p>
                                        <p className="text-xs text-brand-orange font-mono mt-3 uppercase tracking-widest font-bold">12m Saved via Swarm</p>
                                    </div>
                                )}
                                {item.type === 'swarm' && (
                                    <div className="flex flex-col justify-center h-full p-4">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <Zap className="w-5 h-5 text-brand-orange" />
                                                <p className="text-sm font-bold uppercase tracking-wider">Swarm_Sync</p>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] h-5 border-brand-orange/40 text-brand-orange font-bold uppercase px-2">Active</Badge>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div animate={{ width: ["20%", "90%", "50%"] }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-brand-orange" />
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-mono text-white/30 tracking-[0.2em]">
                                                <span>P2P_UPLINK</span>
                                                <span className="text-brand-orange">SYNCED</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </DraggableResizable>
                        ))}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default UIInterns;
