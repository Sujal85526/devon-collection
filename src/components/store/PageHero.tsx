import Image from "next/image";

/**
 * Inner-page header. Text only by default (centred title on ivory); with an image it becomes a
 * split banner — photo on one side, title and copy on the other.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  alt = "",
  focus = "center",
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  image?: string;
  alt?: string;
  focus?: string;
}) {
  if (!image) {
    return (
      <section className="px-6 pb-4 pt-14 text-center md:pt-20">
        {eyebrow && <p className="hero-rise eyebrow text-muted">{eyebrow}</p>}
        <h1 className="mt-4 overflow-hidden pb-[0.12em] font-script text-[clamp(44px,6vw,84px)] leading-[1.02]">
          <span className="hero-line block">{title}</span>
        </h1>
        {subtitle && (
          <p className="hero-rise mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted" style={{ "--d": "0.2s" } as React.CSSProperties}>
            {subtitle}
          </p>
        )}
      </section>
    );
  }
  return (
    <section className="mx-auto grid max-w-[1440px] md:grid-cols-2 md:px-10 md:pt-8">
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-light md:aspect-[5/4]">
        <Image src={image} alt={alt} fill priority quality={90} sizes="(min-width: 768px) 50vw, 100vw" className="hero-zoom object-cover" style={{ objectPosition: focus }} />
      </div>
      <div className="flex flex-col justify-center px-6 py-12 md:px-[12%]">
        {eyebrow && <p className="hero-rise eyebrow text-rose">{eyebrow}</p>}
        <h1 className="mt-4 overflow-hidden pb-[0.12em] font-script text-[clamp(44px,5vw,76px)] leading-[1.02]">
          <span className="hero-line block">{title}</span>
        </h1>
        {subtitle && (
          <p className="hero-rise mt-5 max-w-md text-[14px] leading-[1.9] text-muted" style={{ "--d": "0.2s" } as React.CSSProperties}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
