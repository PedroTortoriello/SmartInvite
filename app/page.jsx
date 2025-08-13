// app/(marketing)/page.tsx  — ou onde você estiver renderizando a landing
import Link from "next/link";
import { Button } from "@/components/LP/button";
import {
  Calendar,
  MessageSquare,
  Users,
  Shield,
  Sparkles,
  Link2,
  CheckCircle2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/LP/accordion";
import { cn } from "@/lib/utils";
import './App.css'
const advantages = [
  { icon: <Link2 className="h-4 w-4" />, text: "Links únicos" },
  { icon: <CheckCircle2 className="h-4 w-4" />, text: "Check-in rápido" },
];

const benefits = [
  {
    icon: <Users className="h-5 w-5" aria-hidden />,
    title: "Gestão de convidados",
    desc: "Acompanhe as confirmações do seu evento em tempo real.",
  },
  {
    icon: <Shield className="h-5 w-5" aria-hidden />,
    title: "Link único e seguro",
    desc: "Cada evento tem um link exclusivo para confirmar presença.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" aria-hidden />,
    title: "Convites por WhatsApp",
    desc: "Envie mensagens com o link do evento.",
  },
];

const pricing = [
  { name: "Grátis", price: "R$ 0", highlight: true, note: "Até 25 convidados" },
  { name: "> 25", price: "R$ 7,90", note: "Mais de 25 convidados" },
  { name: "> 50", price: "R$ 17,90", note: "Mais de 50 convidados" },
  { name: "> 100", price: "R$ 27,90", note: "Mais de 100 convidados" },
  { name: ">150 convidados", price: "R$ 37,90", note: "Até 150 convidados" },
  { name: "200+ convidados", price: "R$ 47,90", note: "200 convidados ou mais" },
];

const faqs = [
  { q: "É realmente grátis?", a: "Sim, até 25 convidados é 100% gratuito." },
  // { q: "Como funciona o envio pelo WhatsApp?", a: "Você conecta sua integração e pode enviar convites e lembretes de forma simples." },
  { q: "Vocês cobram por mês?", a: "Não. A cobrança é por evento com base no número de convidados." },
  { q: "Posso acompanhar confirmações em tempo real?", a: "Sim. As confirmações (RSVP) aparecem no painel em tempo real." },
  // { q: "Existe check-in no dia do evento?", a: "Sim. Você pode fazer o check-in e registrar presenças rapidamente." },
];

export default function Index() {
  return (
    <main className="bg-hero min-h-screen">
      {/* Navbar */}
      <header
        className="sticky top-0 z-20 backdrop-blur border-b border-border/60 bg-background/70 supports-[backdrop-filter]:bg-background/60"
        aria-label="Barra de navegação principal"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="#" aria-label="Ir para o topo" className="flex items-center gap-2">
            <div className="text-lg sm:text-xl font-semibold bg-gradient-brand bg-clip-text text-transparent inline-flex items-center gap-1">
              <Sparkles className="h-4 w-4" aria-hidden />
              SmartInvite
            </div>
          </Link>
          <nav aria-label="Navegação de âncoras" className="hidden md:flex items-center gap-6 text-sm">
            <a href="#beneficios" className="hover:text-primary transition-colors">Benefícios</a>
            <a href="#como-funciona" className="hover:text-primary transition-colors">Como funciona</a>
            <a href="#precos" className="hover:text-primary transition-colors">Preços</a>
            <a href="#duvidas" className="hover:text-primary transition-colors">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/auth" aria-label="Entrar">
              <Button variant="outlineBrand" className="h-9 sm:h-10 px-4">Entrar</Button>
            </Link>
            <Link href="/auth?mode=register" aria-label="Criar meu Evento">
              <Button variant="hero" className="h-9 sm:h-10 px-4">Criar meu Evento</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-24">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary tracking-wide">
              <span className="inline-flex items-center gap-1">
                RSVP • WhatsApp • Check-in
              </span>
            </div>
            <h1 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight text-foreground">
              Organize eventos sem dor de cabeça.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Crie o evento, gere um link de confirmação, envie mensagens e acompanhe tudo em tempo real.
            </p>

            <ul className="mt-5 flex flex-wrap gap-3 text-sm text-foreground/90">
              {advantages.map((item, i) => (
                <li
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 bg-background/60"
                >
                  <span className="text-primary" aria-hidden>{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link href="/auth?mode=register" aria-label="Começar grátis">
                <Button variant="hero" size="lg" className="h-11 px-6">
                  Começar grátis
                </Button>
              </Link>
              <a href="#como-funciona" aria-label="Ver como funciona">
                <Button variant="outlineBrand" size="lg" className="h-11 px-6">
                  Ver como funciona
                </Button>
              </a>
            </div>
      
          </div>

          <div aria-hidden className="rounded-2xl border border-border bg-card/70 backdrop-blur p-6 shadow-sm">
            <div className="aspect-video rounded-xl bg-accent/10 grid place-content-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-accent/20 grid place-content-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <p className="text-foreground font-semibold">Crie, compartilhe e confirme presenças</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <Feature key={i} icon={b.icon} title={b.title} desc={b.desc} />
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
          Como funciona
        </h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            ["Crie seu evento","Título, data, número de convidados e local. O link é gerado automaticamente."],
            ["Compartilhe o link","Envie por WhatsApp"],
            ["Acompanhe tudo","RSVP em tempo real."],
          ].map(([t, d], i) => (
            <article
              key={i}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <div className="text-xs font-semibold text-primary">Passo {i + 1}</div>
              <h3 className="mt-1 font-bold text-foreground">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </article>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/auth?mode=register" aria-label="Criar meu Evento">
            <Button variant="hero" size="lg" className="h-11 px-7">
              Criar meu Evento
            </Button>
          </Link>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="max-w-6xl mx-auto px-4 py-16">
        <header className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Preços</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            A cobrança é por evento. Escolha a faixa que melhor se encaixa no seu público.
          </p>
        </header>
        <div className="grid md:grid-cols-3 gap-6">
          {pricing.slice(0, 3).map((p, i) => (
            <PricingCard key={i} {...p} />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {pricing.slice(3).map((p, i) => (
            <PricingCard key={i + 3} {...p} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="duvidas" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center">
          Dúvidas frequentes
        </h2>
        <div className="mt-8 max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <FaqItem key={i} question={f.q} answer={f.a} />
            ))}
          </Accordion>
        </div>
        <div className="text-center mt-10">
          <Link href="/auth?mode=register" aria-label="Começar agora">
            <Button variant="brand" size="lg" className="h-11 px-7">
              Começar agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Feito para facilitar sua vida com eventos ✨
      </footer>
    </main>
  );
}

/* ==== Componentes ==== */

function Feature({ icon, title, desc }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="inline-flex items-center gap-2 text-primary font-semibold">
        <span className="p-2 rounded-full bg-accent/15 text-primary grid place-content-center" aria-hidden>
          {icon}
        </span>
        {title}
      </div>
      <p className="text-muted-foreground mt-2">{desc}</p>
    </article>
  );
}

function PricingCard({ name, price, note, highlight = false }) {
  return (
    <article
      className={cn(
        "rounded-2xl border p-6 bg-card shadow-sm flex flex-col gap-3",
        highlight ? "border-accent shadow-brand" : "border-border"
      )}
      aria-label={`Plano ${name}`}
    >
      <div className="flex items-center justify-between">
        <h3 className={cn("text-lg font-semibold", highlight && "text-primary")}>{name}</h3>
        {highlight && (
          <span className="text-xs px-2 py-1 rounded-full bg-accent/15 text-primary">Destaque</span>
        )}
      </div>
      <div className="text-3xl font-extrabold text-foreground">{price}</div>
      <p className="text-sm text-muted-foreground">{note}</p>
      <Link href="/auth?mode=register" aria-label={`Escolher plano ${name}`} className="mt-2">
        <Button variant={highlight ? "hero" : "outlineBrand"} className="w-full h-10">
          Criar meu Evento
        </Button>
      </Link>
    </article>
  );
}

function FaqItem({ question, answer }) {
  return (
    <AccordionItem value={question} className="border-border">
      <AccordionTrigger className="text-left">{question}</AccordionTrigger>
      <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
    </AccordionItem>
  );
}
