"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { Reservation } from "@/types";

export default function AdminReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial mock/loaded reservations
    setReservations([
      {
        id: "res-1",
        token: "tok-carlos-mendoza-8492",
        code: "#EO-8492A",
        tastingId: "tasting-malbec-reserva",
        tastingTitle: "Cata Malbec Reserva",
        tastingDate: "Sábado, 24 de Octubre",
        tastingTime: "18:00 - 20:30",
        customerName: "Carlos Mendoza",
        customerEmail: "carlos.mendoza@ejemplo.com",
        customerPhone: "+54 9 261 455-8822",
        spotsCount: 2,
        dietaryRestrictions: "Sin restricciones",
        selectedAddOns: [
          { id: "gran-reserva-bottle", title: "Botella Malbec Gran Reserva 2020", price: 28000, quantity: 1 },
        ],
        subtotal: 118000,
        discountAmount: 11800,
        couponCode: "ORIGEN10",
        totalAmount: 106200,
        paymentMethod: "stripe",
        paymentStatus: "paid",
        checkinStatus: "checked_in",
        checkedInAt: "2026-08-20T18:15:00Z",
        checkedInBy: "Jaifred Pastran",
        createdAt: "2026-08-20T16:00:00Z",
      },
      {
        id: "res-2",
        token: "tok-lucia-ferreyra-7193",
        code: "#EO-7193B",
        tastingId: "tasting-atardecer-vinedo",
        tastingTitle: "Atardecer en el Viñedo",
        tastingDate: "Miércoles, 28 de Octubre",
        tastingTime: "17:30 - 19:30",
        customerName: "Lucía Ferreyra",
        customerEmail: "lucia.f@ejemplo.com",
        customerPhone: "+54 9 11 3499-1122",
        spotsCount: 2,
        dietaryRestrictions: "Menú Vegetariano",
        selectedAddOns: [
          { id: "private-transfer", title: "Traslado Privado Ida y Vuelta", price: 18000, quantity: 1 },
        ],
        subtotal: 88000,
        discountAmount: 0,
        totalAmount: 88000,
        paymentMethod: "stripe",
        paymentStatus: "paid",
        checkinStatus: "pending",
        createdAt: "2026-08-21T02:30:00Z",
      },
      {
        id: "res-3",
        token: "tok-martin-rossi-6204",
        code: "#EO-6204C",
        tastingId: "tasting-blancos-altura",
        tastingTitle: "Blancos de Altura",
        tastingDate: "Lunes, 02 de Noviembre",
        tastingTime: "11:00 - 13:00",
        customerName: "Martín Rossi",
        customerEmail: "martin.rossi@ejemplo.com",
        customerPhone: "+54 9 261 887-1234",
        spotsCount: 1,
        dietaryRestrictions: "Celíaco / Sin TACC",
        selectedAddOns: [],
        subtotal: 40000,
        discountAmount: 0,
        totalAmount: 40000,
        paymentMethod: "bank_transfer",
        paymentStatus: "pending_transfer",
        checkinStatus: "pending",
        createdAt: "2026-08-20T10:00:00Z",
      },
      {
        id: "res-4",
        token: "tok-ana-gimenez-5109",
        code: "#EO-5109D",
        tastingId: "tasting-malbec-reserva",
        tastingTitle: "Cata Malbec Reserva",
        tastingDate: "Sábado, 24 de Octubre",
        tastingTime: "18:00 - 20:30",
        customerName: "Ana P. Giménez",
        customerEmail: "ana.g@ejemplo.com",
        customerPhone: "+54 9 261 990-4411",
        spotsCount: 2,
        dietaryRestrictions: "Ninguna",
        selectedAddOns: [],
        subtotal: 90000,
        discountAmount: 0,
        totalAmount: 90000,
        paymentMethod: "stripe",
        paymentStatus: "paid",
        checkinStatus: "pending",
        createdAt: "2026-08-20T11:00:00Z",
      },
    ]);
    setLoading(false);
  }, []);

  const handleToggleCheckIn = async (id: string) => {
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = r.checkinStatus === "checked_in" ? "pending" : "checked_in";
          return {
            ...r,
            checkinStatus: next,
            checkedInAt: next === "checked_in" ? new Date().toISOString() : undefined,
          };
        }
        return r;
      })
    );
  };

  const handleConfirmTransfer = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, paymentStatus: "paid" } : r))
    );
  };

  const exportToCSV = () => {
    const headers = "Codigo,Asistente,Email,Telefono,Cata,Fecha,Cupos,Total,Pago,Checkin,Dieta\n";
    const rows = reservations
      .map(
        (r) =>
          `"${r.code}","${r.customerName}","${r.customerEmail}","${r.customerPhone}","${r.tastingTitle}","${r.tastingDate}",${r.spotsCount},${r.totalAmount},"${r.paymentStatus}","${r.checkinStatus}","${r.dietaryRestrictions || ""}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asistentes-el-origen-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(252, 249, 248);
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(122, 32, 72);
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.text("EL ORIGEN — LISTA DE RECEPCIÓN EN PUERTA", 105, 25, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(95, 94, 91);
    doc.text(`Generado el ${new Date().toLocaleDateString("es-CL")} • Total Asistentes: ${reservations.length}`, 105, 32, { align: "center" });

    doc.setDrawColor(217, 192, 198);
    doc.line(15, 38, 195, 38);

    let y = 48;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(27, 28, 28);
    doc.text("CÓDIGO", 15, y);
    doc.text("ASISTENTE", 45, y);
    doc.text("EVENTO", 95, y);
    doc.text("CUPOS", 145, y);
    doc.text("CHECK-IN", 165, y);

    y += 4;
    doc.setDrawColor(217, 192, 198);
    doc.line(15, y, 195, y);

    doc.setFont("helvetica", "normal");
    y += 8;

    reservations.forEach((r) => {
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
      doc.text(r.code, 15, y);
      doc.text(r.customerName, 45, y);
      doc.text(r.tastingTitle.substring(0, 22), 95, y);
      doc.text(`${r.spotsCount} p.`, 145, y);
      doc.text(r.checkinStatus === "checked_in" ? "[✓] INGRESÓ" : "[ ] Pendiente", 165, y);
      y += 8;
    });

    doc.save(`Lista-Recepcion-El-Origen.pdf`);
  };

  const filtered = reservations.filter((r) => {
    if (filterStatus === "checked_in" && r.checkinStatus !== "checked_in") return false;
    if (filterStatus === "pending" && r.checkinStatus !== "pending") return false;
    if (filterStatus === "transfer" && r.paymentStatus !== "pending_transfer") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q) ||
        r.tastingTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-surface-variant pb-6">
        <div>
          <p className="text-xs uppercase font-bold tracking-[0.2em] text-secondary mb-1">
            Recepción & Control de Asistencia
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface">
            Asistentes & Reservas
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface border border-outline-variant hover:border-primary text-on-surface rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-primary">table_view</span>
            Exportar CSV
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface border border-outline-variant hover:border-primary text-on-surface rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm text-primary">picture_as_pdf</span>
            PDF Recepción
          </button>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface p-4 rounded-2xl border border-surface-variant soft-shadow">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { id: "all", label: "Todos" },
            { id: "checked_in", label: "Check-in Realizado" },
            { id: "pending", label: "Pendientes en Puerta" },
            { id: "transfer", label: "Transferencias x Confirmar" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filterStatus === f.id
                  ? "bg-primary-container text-white"
                  : "bg-surface-container text-secondary hover:bg-surface-variant"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código..."
            className="w-full bg-surface-container-low border border-surface-variant rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-secondary text-sm">
            search
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-surface-variant soft-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-secondary">Ticket / Código</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-secondary">Asistente</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-secondary">Cata & Fecha</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-secondary">Cupos & Add-ons</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-secondary">Monto</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-secondary">Pago</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-secondary text-center">Acciones Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-primary">
                    {r.code}
                    <a
                      href={`/confirmacion/${r.id}?token=${r.token}`}
                      target="_blank"
                      className="block text-[10px] text-secondary font-sans hover:underline"
                    >
                      Ver Ticket QR ↗
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-on-surface text-sm">{r.customerName}</p>
                    <p className="text-[11px] text-secondary">{r.customerEmail}</p>
                    <p className="text-[10px] text-secondary font-mono">{r.customerPhone}</p>
                    {r.dietaryRestrictions && (
                      <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                        Dieta: {r.dietaryRestrictions}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-on-surface">{r.tastingTitle}</p>
                    <p className="text-secondary">{r.tastingDate}</p>
                    <p className="text-[10px] text-secondary">{r.tastingTime} hs</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-on-surface">{r.spotsCount} personas</p>
                    {r.selectedAddOns.map((a, i) => (
                      <p key={i} className="text-[10px] text-primary">
                        + {a.title} ({a.quantity})
                      </p>
                    ))}
                  </td>
                  <td className="px-5 py-4 font-serif font-bold text-sm text-on-surface">
                    ${r.totalAmount.toLocaleString("es-CL")}
                  </td>
                  <td className="px-5 py-4">
                    {r.paymentStatus === "paid" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Pagado ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConfirmTransfer(r.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                        title="Clic para confirmar transferencia bancaria"
                      >
                        Confirmar Transf.
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => handleToggleCheckIn(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        r.checkinStatus === "checked_in"
                          ? "bg-emerald-700 text-white shadow-sm"
                          : "bg-surface-container border border-outline-variant hover:border-primary text-secondary"
                      }`}
                    >
                      {r.checkinStatus === "checked_in" ? "✓ Ingresó" : "Marcar Ingreso"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
