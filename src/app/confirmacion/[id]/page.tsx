import { redirect } from "next/navigation";

/* Ruta anterior: las reservas ahora se gestionan en /orden/[token]. */
export default function ConfirmationRedirect({ searchParams }: { searchParams: { token?: string } }) {
  redirect(searchParams.token ? `/orden/${encodeURIComponent(searchParams.token)}` : "/catas");
}
