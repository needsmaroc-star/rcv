import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/data/queries";
import { ImportForm } from "./import-form";

export default async function ImportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold mb-1">Importer — {company.name}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Sélectionne le fichier Excel exporté depuis Odoo pour {company.name}.
        Les nouvelles factures seront ajoutées, les factures existantes mises
        à jour, et celles qui disparaissent basculeront en historique. Rien
        de ce que tu as saisi manuellement (statuts, commentaires) ne sera
        perdu.
      </p>
      <ImportForm companySlug={company.slug} />
    </div>
  );
}
