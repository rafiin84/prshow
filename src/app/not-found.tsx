import Link from "next/link";
export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-semibold tracking-widest text-accent uppercase">404</p>
        <h1 className="mt-2 text-4xl font-semibold">This scene was cut</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted-fg">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 font-medium text-accent-fg">Back to PR Show</Link>
      </div>
    </div>
  );
}
