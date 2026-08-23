import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "./data";

export function Faq() {
  return (
    <section id="faq" className="bg-background py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-display text-navy sm:text-6xl">
          Frequently asked
        </h2>
        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-b-0">
              <div className="border-t border-navy/[0.08]">
                <AccordionTrigger className="py-7 text-left font-display text-lg font-semibold tracking-display text-navy hover:no-underline sm:text-xl">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-8 text-base leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
