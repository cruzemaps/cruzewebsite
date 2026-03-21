import Navbar from "@/components/v1/Navbar";
import SavingsCalculator from "@/components/SavingsCalculator";
import Footer from "@/components/v1/Footer";

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
