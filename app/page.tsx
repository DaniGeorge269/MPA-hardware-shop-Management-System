import {
  ArrowRight,
  Award,
  Building2,
  Clock3,
  HardHat,
  Menu,
  Package,
  Phone,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";

const products = [
  {
    title: "Cement & Concrete",
    description: "High-grade cement and aggregates engineered for structural integrity.",
    icon: Building2,
  },
  {
    title: "Steel & Reinforcement",
    description: "Rebar, structural beams, and mesh built for heavy load tolerances.",
    icon: Wrench,
  },
  {
    title: "Plumbing & Piping",
    description: "Pressure pipes, fittings, and industrial drainage solutions.",
    icon: Package,
  },
  {
    title: "Tools & Equipment",
    description: "Professional-grade power and hand tools for on-site execution.",
    icon: HardHat,
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Certified Materials",
    text: "Fully compliant supplies tested for structural reliability and longevity.",
  },
  {
    icon: Truck,
    title: "On-Site Logistics",
    text: "Direct-to-site scheduling to keep your build timeline on track.",
  },
  {
    icon: Award,
    title: "Volume Pricing",
    text: "Wholesale contractor tiers tailored for commercial and residential budgets.",
  },
  {
    icon: Clock3,
    title: "Dedicated Dispatch",
    text: "Fast quotation turnaround and knowledgeable procurement reps.",
  },
];

export default function Home() {
  return (
    <main className="bg-neutral-50 text-neutral-900 selection:bg-[#c8102e] selection:text-white">
      {/* ================= NAVBAR ================= */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#c8102e] text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-lg font-bold tracking-tight text-white leading-none">
                MPA
              </span>
              <span className="block text-[10px] font-medium tracking-widest text-neutral-400 uppercase">
                Hardware
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-300 lg:flex">
            <a href="#home" className="text-white transition hover:text-white">
              Home
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
            <a href="#products" className="transition hover:text-white">
              Products
            </a>
            <a href="#services" className="transition hover:text-white">
              Services
            </a>
            <a href="#contact" className="transition hover:text-white">
              Contact
            </a>
          </nav>

          {/* Action */}
          <div className="flex items-center gap-4">
            <a
              href="#contact"
              className="hidden items-center gap-2 rounded-sm bg-[#c8102e] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#a50d26] sm:inline-flex"
            >
              <Phone className="h-3.5 w-3.5" />
              Get Quote
            </a>

            <button
              type="button"
              className="rounded p-2 text-neutral-400 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section
        id="home"
        className="relative flex min-h-screen items-center bg-neutral-950 pt-20"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2200&q=85')",
          }}
        />
        <div className="absolute inset-0 bg-neutral-950/75 mix-blend-multiply" />
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-28 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Building foundations that{" "}
              <span className="text-[#c8102e]">endure.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-300">
              Commercial-grade building materials, precision structural steel,
              and essential site hardware supplied direct to builders and
              contractors.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#products"
                className="inline-flex items-center gap-2 rounded-sm bg-[#c8102e] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#a50d26]"
              >
                Browse Inventory
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-sm border border-neutral-700 bg-neutral-900/60 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-neutral-200 backdrop-blur-sm transition hover:border-neutral-500 hover:text-white"
              >
                Request Pricing
              </a>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="absolute bottom-0 inset-x-0 border-t border-white/10 bg-neutral-950/90 backdrop-blur-md">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
            {[
              { value: "Grade A", label: "Certified Materials" },
              { value: "Same-Day", label: "Local Dispatch" },
              { value: "100%", label: "Contractor Direct" },
              { value: "24h", label: "Quote Response" },
            ].map((stat) => (
              <div key={stat.label} className="p-5 text-center sm:text-left">
                <p className="text-base font-bold text-white tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= INTRO ================= */}
      <section id="about" className="py-24 bg-white border-b border-neutral-200">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              Everything required to take plans into execution.
            </h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed text-neutral-600">
            <p>
              MPA Hardware coordinates the sourcing and delivery of structural
              and finishing supplies. We work directly with site managers,
              independent contractors, and developers who need reliable material
              flows without delays.
            </p>
            <p>
              From basic site prep to turnkey installations, our catalog is
              curated for durability, building code compliance, and dependable
              structural performance.
            </p>
          </div>
        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section id="products" className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
                Core Categories
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Foundational supplies stocked and ready for dispatch.
              </p>
            </div>

            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#c8102e] hover:underline"
            >
              Request full catalog <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => {
              const Icon = product.icon;
              return (
                <div
                  key={product.title}
                  className="group flex flex-col justify-between rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-neutral-100 text-neutral-700 transition group-hover:bg-[#c8102e] group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-base font-semibold text-neutral-900">
                      {product.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                      {product.description}
                    </p>
                  </div>

                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#c8102e] hover:text-[#a50d26]"
                  >
                    View Specs <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= BENEFITS ================= */}
      <section id="services" className="border-t border-neutral-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              Why procurement teams choose us
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Streamlined orders, predictable lead times, and certified materials.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="flex flex-col">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-800">
                    <Icon className="h-5 w-5 text-[#c8102e]" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-neutral-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="relative overflow-hidden bg-neutral-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to price out your bill of quantities?
              </h2>
              <p className="mt-3 text-sm text-neutral-400">
                Send us your material list for an itemized commercial quotation.
              </p>
            </div>
            <a
              href="#contact"
              className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-[#c8102e] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#a50d26]"
            >
              Contact Sales
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ================= CONTACT INFO ================= */}
      <section id="contact" className="border-t border-neutral-200 bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <Phone className="h-5 w-5 text-[#c8102e]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Direct Line
              </p>
              <p className="mt-1 font-semibold text-neutral-900">
                +XXX XXX XXX XXX
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <Building2 className="h-5 w-5 text-[#c8102e]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Yard & Dispatch
              </p>
              <p className="mt-1 font-semibold text-neutral-900">
                MPA Hardware Facility
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-neutral-200 bg-white py-12 text-neutral-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-xs sm:flex-row lg:px-8">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#c8102e] text-white">
              <Building2 className="h-3 w-3" />
            </span>
            MPA Hardware
          </div>

          <div className="flex gap-6">
            <a href="#about" className="hover:text-neutral-900">About</a>
            <a href="#products" className="hover:text-neutral-900">Products</a>
            <a href="#services" className="hover:text-neutral-900">Services</a>
            <a href="#contact" className="hover:text-neutral-900">Contact</a>
          </div>

          <p>© {new Date().getFullYear()} MPA Hardware. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}