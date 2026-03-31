import { Wallet, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const RewardsSection = () => {
    return (
        <section className="py-24 bg-gradient-to-b from-secondary/20 to-background relative border-t border-border/50">
            <div className="container mx-auto px-6">
                <div className="flex flex-col-reverse md:flex-row items-center gap-16 max-w-6xl mx-auto">

                    {/* Mockup / Visual */}
                    <div className="flex-1 w-full max-w-sm relative">
                        <div className="absolute inset-x-0 top-10 bottom-10 bg-primary/20 blur-[60px] rounded-full" />
                        <div className="relative bg-card border border-border rounded-[2.5rem] p-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                            {/* Fake Phone UI */}
                            <div className="bg-background rounded-3xl p-6 border border-border/50 h-[400px] flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/10 to-transparent" />

                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <div className="font-bold text-lg">My Wallet</div>
                                    <Wallet className="w-5 h-5 text-muted-foreground" />
                                </div>

                                <div className="text-center mb-8 relative z-10">
                                    <div className="text-muted-foreground text-sm mb-1">Total Earnings</div>
                                    <div className="text-4xl font-bold text-gradient">$124.50</div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-secondary/50 p-3 rounded-xl border border-border/50">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                <Star className="w-5 h-5 fill-current" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold">Perfect Pace Bonus</div>
                                                <div className="text-xs text-muted-foreground">Today, 8:45 AM</div>
                                            </div>
                                            <div className="text-sm font-bold text-green-500">+$2.50</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                            Earn Rewards for <br /> <span className="text-gradient">Smooth Driving</span>
                        </h2>
                        <p className="text-xl text-muted-foreground mb-8">
                            Cruze partners with top insurers to lower your rates. The smoother you drive, the more you earn.
                            Gamify your commute and turn traffic time into reward time.
                        </p>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
                                <Trophy className="w-8 h-8 text-yellow-500 mb-3" />
                                <div className="font-bold mb-1">Weekly Challenges</div>
                                <div className="text-sm text-muted-foreground">Compete for top commuter spots</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30">
                                <Wallet className="w-8 h-8 text-green-500 mb-3" />
                                <div className="font-bold mb-1">Insurance Rebates</div>
                                <div className="text-sm text-muted-foreground">Save up to 30% on premiums</div>
                            </div>
                        </div>

                        <Button size="lg" className="rounded-full px-8 text-lg hover:scale-105 transition-transform">
                            Start Earning
                        </Button>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default RewardsSection;
