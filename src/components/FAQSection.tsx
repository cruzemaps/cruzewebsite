import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "How does Cruze work?",
      answer: "Cruze uses swarm intelligence to coordinate driver speeds in real-time. When just 5% of drivers on a highway follow Cruze's pacing recommendations, they stabilize traffic flow for everyone, eliminating phantom jams before they form.",
    },
    {
      question: "Do I need special hardware or infrastructure?",
      answer: "No! Cruze works entirely through your smartphone. There's no need for new infrastructure, road modifications, or special vehicle equipment. Just download the app and start driving.",
    },
    {
      question: "Is Cruze free to use?",
      answer: "Yes, Cruze is free for individual drivers. We believe traffic solutions should be accessible to everyone. Fleet and enterprise solutions are available with additional features.",
    },
    {
      question: "How accurate is Cruze's traffic prediction?",
      answer: "Cruze's AI models have 73% higher accuracy than traditional navigation apps because we treat traffic like a fluid, predicting shockwaves and slowdowns before they propagate.",
    },
    {
      question: "Does Cruze work in all cities?",
      answer: "Cruze is currently available in select metropolitan areas and expanding rapidly. Check our coverage map to see if Cruze is available in your area, or sign up to be notified when we launch in your city.",
    },
    {
      question: "How does Cruze protect my privacy?",
      answer: "We take privacy seriously. Cruze only collects anonymized location and speed data necessary for traffic coordination. We never sell your personal information and all data is encrypted in transit.",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-20" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-6">
            FAQ
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Simple answers to common questions.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/50">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
