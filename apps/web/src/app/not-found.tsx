import Link from "next/link";

export default function NotFound() {
  return (
    <section className="m-auto text-center">
      <p className="text-sm font-semibold text-emerald-300">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-slate-300">
        The requested Project_MT page does not exist.
      </p>

      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-white px-4 py-2 font-medium text-slate-950"
      >
        Return home
      </Link>
    </section>
  );
}
