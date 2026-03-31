import { useRef } from "react";

const TrustedBySection = () => {
    const logos = [
        { name: "TechCrunch", src: "https://placehold.co/200x80?text=TechCrunch" },
        { name: "Wired", src: "https://placehold.co/200x80?text=Wired" },
        { name: "City+DOT", src: "https://placehold.co/200x80?text=City+DOT" },
        { name: "State+Farm", src: "https://placehold.co/200x80?text=State+Farm" },
        { name: "Allstate", src: "https://placehold.co/200x80?text=Allstate" },
        { name: "Local+News", src: "https://placehold.co/200x80?text=Local+News" },
        { name: "GovTech", src: "https://placehold.co/200x80?text=GovTech" },
    ];

    return (
        <section className="py-12 bg-background border-b border-border/50 overflow-hidden">
            <div className="container mx-auto px-6 mb-8 text-center">
                <span className="text-muted-foreground text-sm font-semibold uppercase tracking-widest">
                    Featured In & Partnered With
                </span>
            </div>

            <div className="relative flex overflow-hidden group">
                <div className="flex animate-infinite-scroll space-x-16 min-w-full">
                    {[...logos, ...logos, ...logos].map((logo, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-50 hover:opacity-100 hover:scale-110 cursor-pointer"
                        >
                            <img
                                src={logo.src}
                                alt={logo.name}
                                className="max-h-12 w-auto object-contain" // Height constraint
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustedBySection;
