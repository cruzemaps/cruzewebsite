import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock } from "lucide-react";

const SavingsCalculator = () => {
    const [commuteTime, setCommuteTime] = useState([30]);

    const calculateSavings = (minutes: number) => {
        // Linear approximation for demo purposes
        // Assumptions: 10 mins = $50/yr, 90 mins = $600/yr
        const gasSaved = Math.round(minutes * 6.5);
        // Assumptions: 10 mins = 10 hrs/yr, 90 mins = 60 hrs/yr traffic delay reclaimed
        const timeReclaimed = Math.round(minutes * 0.6);

        return { gasSaved, timeReclaimed };
    };

    const savings = calculateSavings(commuteTime[0]);

    return (
        <section className="py-24 bg-secondary/20 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">
                        Calculate Your Savings
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        See how much a smarter commute puts back in your pocket.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="mb-12">
                        <label className="block text-center text-lg font-medium mb-6 text-foreground">
                            How long is your daily commute?
                        </label>
                        <div className="flex items-center gap-4">
                            <span className="text-muted-foreground font-medium w-12 text-right">10m</span>
                            <Slider
                                defaultValue={[30]}
                                max={120}
                                min={10}
                                step={5}
                                value={commuteTime}
                                onValueChange={setCommuteTime}
                                className="flex-1"
                            />
                            <span className="text-muted-foreground font-medium w-12">120m+</span>
                        </div>
                        <div className="text-center mt-4">
                            <span className="text-3xl font-bold text-primary">{commuteTime[0]}</span>
                            <span className="text-muted-foreground ml-2">minutes one-way</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="bg-background/50 rounded-2xl p-6 border border-border/50 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
                                <DollarSign className="w-6 h-6 text-green-500" />
                            </div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-2">
                                Yearly Savings
                            </div>
                            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">
                                ${savings.gasSaved}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">in fuel costs</div>
                        </div>

                        <div className="bg-background/50 rounded-2xl p-6 border border-border/50 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
                                <Clock className="w-6 h-6 text-blue-500" />
                            </div>
                            <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-2">
                                Time Reclaimed
                            </div>
                            <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                                {savings.timeReclaimed}h
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">per year</div>
                        </div>
                    </div>

                    <div className="text-center">
                        <Button
                            className="h-14 px-10 text-lg rounded-full shadow-button hover:shadow-lg transition-all"
                            onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Start Saving Today
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SavingsCalculator;
