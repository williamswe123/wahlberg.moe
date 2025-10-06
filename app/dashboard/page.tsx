import Image from 'next/image';

const highlights = [
  {
    title: 'Crafting thoughtful experiences',
    description:
      'I translate complex ideas into intuitive products. My focus is on designing interfaces that feel effortless while still being technically robust.',
  },
  {
    title: 'Full-stack foundations',
    description:
      'From data modeling to pixel-perfect layouts, I enjoy building each layer of a project and keeping the user experience front and center.',
  },
  {
    title: 'Always learning',
    description:
      'Exploring new frameworks, tools, and ideas keeps my work fresh. Every project is a chance to experiment and grow.',
  },
];

export default function Page() {
  return (
    <section className="grid gap-12 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-blue-500">Hi there, I&apos;m</p>
          <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
            Jonas Wahlberg
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            I design and build delightful digital products for the web. With a background in
            product design and full-stack development, I thrive at the intersection of visuals,
            usability, and clean code.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {highlights.map((highlight) => (
            <article
              key={highlight.title}
              className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-lg font-medium text-slate-900">{highlight.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{highlight.description}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="relative flex items-center justify-center">
        <div className="relative h-80 w-80 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-50 shadow-xl">
          <Image
            src="/profile-portrait.svg"
            alt="Stylized illustration of Jonas Wahlberg"
            fill
            sizes="(min-width: 1024px) 320px, 60vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
