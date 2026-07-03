const foundations = [
  {
    title: "Reliable workout logging",
    description:
      "Capture exercises and sets with durable history and previous-performance context.",
  },
  {
    title: "Visual progress",
    description:
      "Connect body measurements and progress trends to an interactive body model.",
  },
  {
    title: "Explainable guidance",
    description:
      "Show why a training focus is recommended without hiding decisions inside a black box.",
  },
];

export default function HomePage() {
  return (
    <section className="w-full">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold tracking-widest text-emerald-300 uppercase">
          Project foundation
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Train with context. Track progress you can understand.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Project_MT is being built as a visual-first strength-training and
          body-recomposition platform.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {foundations.map((foundation) => (
          <article
            key={foundation.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-lg font-semibold">{foundation.title}</h2>

            <p className="mt-3 leading-7 text-slate-300">
              {foundation.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
