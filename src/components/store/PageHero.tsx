import Image from "next/image";

/**
 * Inner-page header. Text only by default (small label, bold title, left aligned); with an image it
 * becomes a rounded panel — photo on one side, title and copy on the other.
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
      <section className="mx-auto max-w-[1440px] px-4 pb-6 pt-8 sm:px-[22px] md:pt-10">
        {eyebrow && <p className="eyebrow text-ink/50">{eyebrow}</p>}
        <h1 className="font-script mt-1 text-[clamp(32px,4.4vw,56px)] leading-[1.05]">{title}</h1>
        {subtitle && <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/60">{subtitle}</p>}
      </section>
    );
  }
  return (
    <section className="px-1.5 pt-1.5 sm:px-[22px] sm:pt-4">
      <div className="panel grid overflow-hidden p-2.5 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-paper-deep md:aspect-[5/4]">
          <Image src={image} alt={alt} fill priority quality={90} sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" style={{ objectPosition: focus }} />
        </div>
        <div className="flex flex-col justify-center px-5 py-10 md:px-[12%]">
          {eyebrow && <p className="eyebrow text-rose">{eyebrow}</p>}
          <h1 className="font-script mt-3 text-[clamp(36px,4.4vw,64px)] leading-[1.05]">{title}</h1>
          {subtitle && <p className="mt-4 max-w-md text-sm leading-[1.8] text-ink/60">{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}
