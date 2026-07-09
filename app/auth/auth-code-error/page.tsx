import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-details-background px-6 text-center text-details-text-secondary-1">
      <h1 className="font-montserrat text-2xl font-bold">Sign-in failed</h1>
      <p className="font-montserrat text-base">
        We could not complete the sign-in. Please try again.
      </p>
      <Link href="/login" className="font-montserrat font-bold underline">
        Back to login
      </Link>
    </main>
  );
}
