import Image from 'next/image';
import Link from "next/link";

const highlights = [
  {
    title: 'Images of Saga',
    href: '/saga',
    image: '/saga/saga_card.jpg',
  },
  {
    title: 'Images of my Car!',
    href: '/mr2',
    image: '/mr2/mr2_card.jpg',
  },
   {
    title: 'Drifting GP JPN 2024',
    href: '/driftgp',
    image: '/driftgp/driftgp_card.jpg',
  },
];


export default function Page() {
  return (
    <section className="grid gap-12 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.35em] text-blue-500">Hi there, I&apos;m</p>
          <h1 className="text-4xl font-semibold text-slate-900 md:text-5xl">
            William Wahlberg
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            I studied Computer Engineering with a specialization in Data Science at Halmstad University, where I spent five years building a strong foundation in data, algorithms, and problem-solving. In the last two years of my studies, I focused on Artificial Intelligence, exploring advanced machine learning techniques. My master’s thesis—presented at the Intelligent Data Analysis conference—focused on forecasting electric vehicle charging station occupancy using transformers and graph convolutional networks. As part of that work, I co-designed a transfer learning module called the Bridged Attention Module, which significantly improved performance in low-data environments.
            </p>
          <p className="max-w-2xl text-lg text-slate-600">
            Most recently, I worked at Dagg on Aloi, an AI-powered legal document assistant built using OpenAI’s LLMs. I was responsible for developing the core system that automatically completed legal clauses and for building the evaluation framework that measured its performance. This gave me valuable hands-on experience with backend development, real-world testing, and working iteratively with emerging technologies.
          </p>
          <p className="max-w-2xl text-lg text-slate-600">
            Before that, I worked at HMS Industrial Networks, where I developed a testing framework and a suite of tools for validating industrial gateway products. These tools made use of a network tap to send and monitor traffic, enabling performance and reliability testing of hardware under realistic conditions. That role gave me valuable insight into embedded systems, low-level network communication, and the importance of robust testing in industrial environments.
            </p>
          <p className="max-w-2xl text-lg text-slate-600">
            Outside of tech, I’m a car enthusiast with a particular love for Japanese sports cars—I even own a classic Toyota that I enjoy working on. I also play Magic: The Gathering at a local board game club, and when it comes to video games, I tend to dive into JRPGs, strategy, or fighting games.
          </p>
        </div>
              
            
      <div className="grid gap-6 md:grid-cols-2">
        {highlights.map((highlight) => (
          <Link key={highlight.title} href={highlight.href} className="block">
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
              
              {/* Image */}
              <div className="relative h-48 w-full">
                <Image
                  src={highlight.image}
                  alt={highlight.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Title */}
              <div className="p-6">
                <h2 className="text-lg font-medium text-slate-900">
                  {highlight.title}
                </h2>
              </div>
            </article>
          </Link>
        ))}
      </div>
      </div>
      <div className="relative flex items-center justify-center">
        <div className="relative w-full max-w-lg aspect-[722/962] overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-50 shadow-xl">
          <Image
            src="/william_w_glasses.jpg"
            alt="Image of William Wahlberg"
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
