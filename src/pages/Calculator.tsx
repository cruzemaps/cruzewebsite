import Navbar from "@/components/Navbar";
import SavingsCalculator from "@/components/SavingsCalculator";
import Footer from "@/components/Footer";

const Calculator = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <div className="pt-20">
                <SavingsCalculator />
            </div>
            <Footer />
        </div>
    );
};

export default Calculator;
