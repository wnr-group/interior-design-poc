import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { placeholderPages } from "@/lib/site";

/**
 * Holding page for routes the header, footer and promos link to that are
 * outside this prototype, so every link resolves to something honest.
 */
export function generateStaticParams() {
  return Object.keys(placeholderPages).map((key) => ({ slug: [key] }));
}

const lookup = (slug: string[]) => (slug.length === 1 ? placeholderPages[slug[0]] : undefined);

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const page = lookup((await params).slug);
  return page ? { title: page.title } : {};
}

/**
 * The shell (label, note and buttons) doesn't depend on the URL, so it
 * prerenders and shows instantly; only the title and blurb wait on params.
 */
export default function PlaceholderPage({ params }: PageProps<"/[...slug]">) {
  return (
    <section className="page-x py-16 md:py-24">
      <p className="text-sm text-ink-2">Prototype</p>
      <Suspense fallback={<PlaceholderSkeleton />}>
        <PlaceholderDetails params={params} />
      </Suspense>
      <p className="mt-2 max-w-xl text-sm text-ink-2">This page sits outside the design-and-planning prototype.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary h-12">Back to design & planning</Link>
        <Link href="/#furnished-rooms" className="btn-outline h-12">Browse rooms</Link>
      </div>
    </section>
  );
}

async function PlaceholderDetails({ params }: Pick<PageProps<"/[...slug]">, "params">) {
  const page = lookup((await params).slug);
  if (!page) notFound();

  return (
    <>
      <h1 className="text-hero mt-2">{page.title}</h1>
      <p className="mt-4 max-w-xl text-base leading-6">{page.blurb}</p>
    </>
  );
}

function PlaceholderSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="mt-2 h-10 w-64 max-w-full bg-surface md:h-14" />
      <div className="mt-4 h-6 w-96 max-w-full bg-surface" />
    </div>
  );
}
