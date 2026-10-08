import { redirect } from "next/navigation";

/* La bandeja de solicitudes ahora vive en /admin/solicitudes (pestañas Privadas, Marcas y Sommeliers). */
export default function AdminPrivadasRedirect() {
  redirect("/admin/solicitudes?tab=privadas");
}
