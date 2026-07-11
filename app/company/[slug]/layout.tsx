import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/data/queries";

const NAV_ITEMS = [
  { href: "", label: "Dashboard" },
  { href: "/factures", label: "Factures" },
  { href: "/clients", label: "Clients" },
  { href: "/import", label: "Importer" },
];

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            ← Changer de société
          </Link>
          <div className="text-lg font-semibold mt-1">{company.name}</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={`/company/${slug}${item.href}`}
              className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
