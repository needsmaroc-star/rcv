import Link from "next/link";
import { auth } from "@/auth";
import { getAllCompanies } from "@/lib/data/queries";

export default async function HomePage() {
  const session = await auth();
  const companies = await getAllCompanies();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-semibold mb-1">Choisir une société</h1>
      <p className="text-sm text-gray-500 mb-8">
        Connecté en tant que {session?.user?.name ?? session?.user?.email}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        {companies.map((c) => (
          <Link
            key={c.id}
            href={`/company/${c.slug}`}
            className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 hover:shadow-sm transition-all"
          >
            <div className="text-lg font-medium">{c.name}</div>
          </Link>
        ))}
        {companies.length === 0 && (
          <p className="col-span-2 text-sm text-gray-500 text-center">
            Aucune société trouvée. Lance d&apos;abord l&apos;initialisation via
            <code className="mx-1 bg-gray-100 px-1.5 py-0.5 rounded">/api/setup?token=...</code>
          </p>
        )}
      </div>
    </div>
  );
}
