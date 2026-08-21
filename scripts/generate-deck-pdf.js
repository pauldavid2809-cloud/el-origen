const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

function createDossierPDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Colors
  const cPrimary = [92, 5, 49]; // #5C0531
  const cPrimaryDark = [60, 3, 32];
  const cGold = [201, 168, 76]; // #C9A84C
  const cTextDark = [30, 28, 30];
  const cTextMuted = [105, 100, 103];
  const cBgLight = [250, 248, 247]; // #FAF8F7
  const cCardBg = [255, 255, 255];
  const cBorder = [228, 222, 224];
  const cAccentRed = [122, 32, 72];

  // Helper: Header & Footer for content pages
  function drawPageHeaderFooter(pageNum, totalPages, sectionTitle) {
    // Top bar
    doc.setDrawColor(...cBorder);
    doc.setLineWidth(0.3);
    doc.line(15, 16, pageWidth - 15, 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...cPrimary);
    doc.text("EL ORIGEN", 15, 12);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...cTextMuted);
    doc.text("•  Caracas, Venezuela  •  Dossier de Plataforma Digital", 35, 12);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...cGold);
    doc.text(sectionTitle.toUpperCase(), pageWidth - 15, 12, { align: "right" });

    // Bottom bar
    doc.setDrawColor(...cBorder);
    doc.line(15, pageHeight - 14, pageWidth - 15, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...cTextMuted);
    doc.text("© 2026 El Origen Wine Experience  |  contacto@elorigen.com  |  +58 414-1074007", 15, pageHeight - 9);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 15, pageHeight - 9, { align: "right" });
  }

  // Helper: Section Title
  function drawSectionTitle(y, eyebrow, title) {
    doc.setFillColor(92, 5, 49, 0.06);
    doc.setDrawColor(...cGold);
    doc.setLineWidth(0.4);
    doc.roundedRect(15, y, 55, 5.5, 2.7, 2.7, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...cPrimary);
    doc.text(eyebrow.toUpperCase(), 18, y + 3.8);

    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...cPrimary);
    doc.text(title, 15, y + 13);

    doc.setDrawColor(...cGold);
    doc.setLineWidth(0.8);
    doc.line(15, y + 16, 45, y + 16);

    return y + 22;
  }

  // Helper: Double-Bezel Card Box
  function drawCard(x, y, w, h, title, textLines, badgeText = "") {
    // Outer frame
    doc.setFillColor(245, 242, 243);
    doc.setDrawColor(...cBorder);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, w, h, 3.5, 3.5, "FD");

    // Inner core
    const pad = 1.8;
    doc.setFillColor(...cCardBg);
    doc.roundedRect(x + pad, y + pad, w - pad * 2, h - pad * 2, 2.5, 2.5, "F");

    let textY = y + pad + 6;

    if (badgeText) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...cGold);
      doc.text(badgeText.toUpperCase(), x + pad + 4, textY);
      textY += 4.5;
    }

    if (title) {
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...cPrimary);
      doc.text(title, x + pad + 4, textY);
      textY += 5.5;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...cTextDark);

    textLines.forEach((line) => {
      doc.text(line, x + pad + 4, textY);
      textY += 4.2;
    });
  }

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  doc.setFillColor(...cPrimary);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Gold border frame
  doc.setDrawColor(...cGold);
  doc.setLineWidth(1.2);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
  doc.setLineWidth(0.4);
  doc.rect(14.5, 14.5, pageWidth - 29, pageHeight - 29);

  // Geometric Mountain & Wine Motif
  doc.setDrawColor(...cGold);
  doc.setLineWidth(0.8);
  doc.line(85, 75, 105, 52);
  doc.line(105, 52, 125, 75);
  doc.line(97, 75, 105, 63);
  doc.line(105, 63, 113, 75);

  // Wine glass icon circle
  doc.setFillColor(201, 168, 76, 0.15);
  doc.circle(105, 64, 18, "F");

  // Eyebrow
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...cGold);
  doc.text("CARACAS, VENEZUELA  •  ECOSISTEMA DIGITAL EXCLUSIVO", 105, 96, { align: "center" });

  // Main Brand
  doc.setFont("times", "bold");
  doc.setFontSize(38);
  doc.setTextColor(255, 255, 255);
  doc.text("EL ORIGEN", 105, 114, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.setTextColor(...cGold);
  doc.text("Wine Experience & Curaduría de Colección", 105, 124, { align: "center" });

  // Divider
  doc.setDrawColor(...cGold);
  doc.setLineWidth(0.8);
  doc.line(75, 134, 135, 134);

  // Subtitle / Scope
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(240, 235, 238);
  const coverIntro = [
    "Dossier Técnico & Guía Integral de la Plataforma",
    "Venta de Cupos Online  •  Check-in QR  •  Ficha Sensorial en Vivo",
    "Gestión de Catas  •  Pasarelas Multimoneda  •  Alianzas Gastronómicas",
  ];
  let cY = 148;
  coverIntro.forEach((line) => {
    doc.text(line, 105, cY, { align: "center" });
    cY += 6.5;
  });

  // Highlight Box in Center
  doc.setFillColor(255, 255, 255, 0.07);
  doc.setDrawColor(...cGold);
  doc.setLineWidth(0.5);
  doc.roundedRect(30, 180, pageWidth - 60, 48, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...cGold);
  doc.text("ALIANZAS GASTRONÓMICAS & CURADURÍA EN CARACAS", 105, 191, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  const partnersSummary = [
    "• Acqua Panna & S.Pellegrino (@brandsimex_vzla) — The Fine Dining Waters",
    "• Maratea Trattoria (@maratea.ccs) — Maridajes de Alta Cocina Italiana",
    "• Quesos Sowi (@quesossowi) — Productos Lácteos & Charcutería Artesanal",
    "• Belkis Croquer (@belkiscroquer) — Head Sommelier & Dirección Sensorial",
  ];
  let pY = 200;
  partnersSummary.forEach((p) => {
    doc.text(p, 36, pY);
    pY += 5.8;
  });

  // Footer on cover
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(200, 190, 195);
  doc.text("Head Sommelier: Belkis Croquer  |  Sommelier Anfitrión: Jaifred Pastran", 105, 258, { align: "center" });
  doc.text("WhatsApp Concierge Oficial: +58 414-1074007  |  contacto@elorigen.com", 105, 264, { align: "center" });
  doc.text("Versión 2.0  •  Desplegado en Producción 2026", 105, 270, { align: "center" });

  // ==========================================
  // PAGE 2: VISIÓN, ARQUITECTURA & ALIADOS
  // ==========================================
  doc.addPage();
  drawPageHeaderFooter(2, 6, "1. Visión & Arquitectura");

  let curY = drawSectionTitle(24, "Propuesta de Valor", "Visión del Proyecto & Alianzas en Caracas");

  // Intro text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...cTextDark);
  const p1Text = [
    "El Origen es una plataforma boutique diseñada exclusivamente para el mercado de Caracas, Venezuela,",
    "que transforma la asistencia a catas de vino en una experiencia digital fluida y de altísima gama. Combina",
    "curaduría de vinos internacionales de colección con gastronomía de autor y tecnología interactiva en tiempo real.",
  ];
  p1Text.forEach((l) => {
    doc.text(l, 15, curY);
    curY += 4.5;
  });
  curY += 4;

  // 3 Value Pillars
  const pillarW = (pageWidth - 30 - 8) / 3;
  drawCard(
    15,
    curY,
    pillarW,
    38,
    "Curaduría Internacional",
    [
      "Selección de etiquetas",
      "de España, Francia, Italia,",
      "Argentina y Chile servidas",
      "en cristalería de alta gama.",
    ],
    "Pilar 01"
  );
  drawCard(
    15 + pillarW + 4,
    curY,
    pillarW,
    38,
    "Grupos Exclusivos",
    [
      "Experiencias íntimas",
      "limitadas a 15-20 cupos",
      "con sommelier certificado",
      "en locaciones selectas.",
    ],
    "Pilar 02"
  );
  drawCard(
    15 + (pillarW + 4) * 2,
    curY,
    pillarW,
    38,
    "Tecnología Sensorial",
    [
      "Pase QR instantáneo,",
      "rueda digital de aromas y",
      "emisión de certificado",
      "oficial para Instagram.",
    ],
    "Pilar 03"
  );

  curY += 44;

  // Partners Grid
  curY = drawSectionTitle(curY, "Red de Excelencia", "Alianzas Gastronómicas & Marcas Oficiales");

  const halfW = (pageWidth - 30 - 6) / 2;

  drawCard(
    15,
    curY,
    halfW,
    38,
    "Acqua Panna & S.Pellegrino",
    [
      "Rol: The Fine Dining Waters",
      "Aguas minerales de lujo para limpieza",
      "de paladar y maridaje entre tiempos.",
      "Instagram Oficial: @brandsimex_vzla",
    ],
    "Aguas de Lujo"
  );

  drawCard(
    15 + halfW + 6,
    curY,
    halfW,
    38,
    "Maratea Trattoria",
    [
      "Rol: Trattoria Ítalo-Venezolana",
      "Pastas artesanales, antipastos finos",
      "y cenas maridaje exclusivas en Caracas.",
      "Instagram Oficial: @maratea.ccs",
    ],
    "Alta Cocina"
  );

  curY += 42;

  drawCard(
    15,
    curY,
    halfW,
    38,
    "Quesos Sowi",
    [
      "Rol: Productos Lácteos & Charcutería",
      "Quesos madurados de autor y tablas",
      "gourmet diseñadas para cada vino.",
      "Instagram Oficial: @quesossowi",
    ],
    "Maridaje Artesanal"
  );

  drawCard(
    15 + halfW + 6,
    curY,
    halfW,
    38,
    "Belkis Croquer",
    [
      "Rol: Head Sommelier & Curadora",
      "Creadora de 'De Cata en Cata', guía",
      "experta en fases sensoriales y armonías.",
      "Instagram Oficial: @belkiscroquer",
    ],
    "Dirección Enológica"
  );

  // ==========================================
  // PAGE 3: FRONTEND & EXPERIENCIA DE CLIENTE
  // ==========================================
  doc.addPage();
  drawPageHeaderFooter(3, 6, "2. Módulos Frontend");

  curY = drawSectionTitle(24, "Flujo de Usuario", "Experiencia de Cliente & Reserva Paso a Paso");

  const featW = (pageWidth - 30 - 6) / 2;

  drawCard(
    15,
    curY,
    featW,
    44,
    "1. Portada & Navegación Bilingüe",
    [
      "• Conmutador instantáneo Español ⇄ Inglés.",
      "• Persistencia de idioma en localStorage.",
      "• Hero con métricas de 4-5 copas y grupos.",
      "• Diseño Double-Bezel de alta gama.",
      "• Botón flotante de WhatsApp Concierge.",
    ],
    "Ruta: /"
  );

  drawCard(
    15 + featW + 6,
    curY,
    featW,
    44,
    "2. Catálogo Interactivo de Catas",
    [
      "• Filtros por estilo: Tintos, Blancos, Sunset.",
      "• Buscador predictivo en tiempo real.",
      "• Tarjetas con contador dinámico de cupos.",
      "• Visualización de vinos, maridaje y sommelier.",
      "• Indicadores de estado 'Agotado' / 'Activo'.",
    ],
    "Ruta: /catas"
  );

  curY += 49;

  drawCard(
    15,
    curY,
    featW,
    48,
    "3. Checkout & Pasarela Multimoneda",
    [
      "• Paso 1: Selección de cupos y fecha.",
      "• Paso 2: Datos, WhatsApp y celiaquía/dietas.",
      "• Paso 3: Cupones y selección de pago:",
      "  - Tarjetas Internacionales (Stripe / Apple Pay)",
      "  - Zelle / Pago Móvil (Tasa oficial BCV)",
      "• Add-ons opcionales (Botella / Copas / Quesos).",
    ],
    "Ruta: /catas/[id]"
  );

  drawCard(
    15 + featW + 6,
    curY,
    featW,
    48,
    "4. Confirmación & Ticket QR Instantáneo",
    [
      "• Código de reserva único de 8 caracteres.",
      "• Generación de código QR de acceso criptográfico.",
      "• Descarga de Ticket PDF conmemorativo.",
      "• Botón 'Añadir a Google Calendar' prellenado.",
      "• Enlace directo a la Ficha Sensorial en vivo.",
    ],
    "Ruta: /confirmacion/[id]"
  );

  curY += 53;

  drawCard(
    15,
    curY,
    featW,
    46,
    "5. Ficha de Cata Sensorial en Vivo",
    [
      "• Rueda interactiva de familias aromáticas.",
      "• Fases guiadas: Visual, Olfativa y Gustativa.",
      "• Calificación interactiva sobre 100 puntos.",
      "• Generador de Diploma PDF y Story de Instagram",
      "  con firmas de Belkis Croquer y Jaifred Pastran.",
    ],
    "Ruta: /cata-en-vivo/[token]"
  );

  drawCard(
    15 + featW + 6,
    curY,
    featW,
    46,
    "6. Galería de Recuerdos & Catas Privadas",
    [
      "• Galería fotográfica con Lightbox interactivo.",
      "• Descarga de fotos de alta resolución.",
      "• Cotizador corporativo B2B (/privadas)",
      "  para agasajos VIP, empresas y aniversarios",
      "  con menú de 4 tiempos y traslado privado.",
    ],
    "Rutas: /recuerdos & /privadas"
  );

  // ==========================================
  // PAGE 4: PANEL DE ADMINISTRACIÓN
  // ==========================================
  doc.addPage();
  drawPageHeaderFooter(4, 6, "3. Panel Administrativo");

  curY = drawSectionTitle(24, "Gestión Operativa", "Panel de Control para Sommeliers & Staff");

  // Intro
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...cTextDark);
  doc.text(
    "El backoffice administrativo permite gestionar integralmente las operaciones del negocio sin tocar código:",
    15,
    curY
  );
  curY += 6;

  drawCard(
    15,
    curY,
    featW,
    42,
    "Dashboard General & Métricas",
    [
      "• Total de ingresos recaudados en USD.",
      "• Tasa de ocupación de cupos por experiencia.",
      "• Gráfico de reservas diarias.",
      "• Alertas de cupos críticos y lista de asistentes.",
    ],
    "Ruta: /admin"
  );

  drawCard(
    15 + featW + 6,
    curY,
    featW,
    42,
    "Gestión de Catas & Eventos",
    [
      "• Creación y edición de fechas de cata.",
      "• Configuración de precios ($USD), cupos y vinos.",
      "• Carga de perfiles aromáticos y maridajes.",
      "• Asignación de Sommelier anfitrión.",
    ],
    "Ruta: /admin/catas"
  );

  curY += 47;

  drawCard(
    15,
    curY,
    featW,
    44,
    "Escáner QR de Check-in",
    [
      "• Escaneo en puerta mediante cámara o entrada manual.",
      "• Validación instantánea en 160ms.",
      "• Doble-Bezel con confirmación táctil y acústica.",
      "• Prevención estricta de doble uso de tickets.",
    ],
    "Ruta: /admin/scanner"
  );

  drawCard(
    15 + featW + 6,
    curY,
    featW,
    44,
    "Gestión de Reservas & Asistentes",
    [
      "• Listado completo con buscador por nombre/código.",
      "• Filtro por restricciones dietéticas (Celíacos/Veg).",
      "• Marcado manual de pagos por Zelle/Pago Móvil.",
      "• Reenvío de tickets QR por correo/WhatsApp.",
    ],
    "Ruta: /admin/reservas"
  );

  curY += 49;

  drawCard(
    15,
    curY,
    featW,
    40,
    "Cupones & Promociones",
    [
      "• Creación de códigos (% descuento).",
      "• Fijación de límites de uso y fecha de expiración.",
      "• Métricas de cupones canjeados en checkout.",
    ],
    "Ruta: /admin/cupones"
  );

  drawCard(
    15 + featW + 6,
    curY,
    featW,
    40,
    "Simulador de Automatizaciones",
    [
      "• Disparo de WhatsApp 24h previas al evento.",
      "• Envío de email con recordatorio y código de vestimenta.",
      "• Log de eventos y alertas automáticas al Sommelier.",
    ],
    "Ruta: /admin/automatizaciones"
  );

  // ==========================================
  // PAGE 5: SEO, SCHEMA.ORG & FICHA TÉCNICA
  // ==========================================
  doc.addPage();
  drawPageHeaderFooter(5, 6, "4. SEO & Stack Técnico");

  curY = drawSectionTitle(24, "Infraestructura", "Optimización de Búsqueda & Arquitectura Técnica");

  // Technical Specs Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...cPrimary);
  doc.text("Stack Tecnológico & Dependencias Principales", 15, curY);
  curY += 5;

  const stackRows = [
    ["Framework", "Next.js 14 (App Router con Server & Client Components)"],
    ["Lenguaje", "TypeScript 5.6 (Tipado estricto con interfaces de dominio)"],
    ["Estilos & UI", "Tailwind CSS + Paleta de lujo (Vinotinto, Blanco, Oro, Manrope, Playfair)"],
    ["Base de Datos", "Supabase PostgreSQL con fallback en memoria local sincronizado"],
    ["Generación PDF", "jsPDF para tickets QR vectoriales y Diplomas de Degustador"],
    ["Efectos & Micro-Motion", "Canvas Confetti, transiciones cúbicas Emil Kowalski (0.16, 1, 0.3, 1)"],
  ];

  stackRows.forEach(([tech, desc]) => {
    doc.setFillColor(248, 245, 246);
    doc.rect(15, curY, 45, 6.5, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(60, curY, pageWidth - 75, 6.5, "F");
    doc.setDrawColor(...cBorder);
    doc.rect(15, curY, pageWidth - 30, 6.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...cPrimary);
    doc.text(tech, 18, curY + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...cTextDark);
    doc.text(desc, 63, curY + 4.5);

    curY += 6.5;
  });

  curY += 8;

  // SEO Specs
  curY = drawSectionTitle(curY, "Posicionamiento Google", "Estrategia de SEO Técnico para Caracas");

  drawCard(
    15,
    curY,
    featW,
    44,
    "Datos Estructurados Schema.org",
    [
      "• Tipo EventVenue & FoodEstablishment.",
      "• Geo-coordenadas Caracas: 10.4806, -66.9036.",
      "• FAQPage Schema para Rich Snippets en Google.",
      "• Monedas: USD y VES (Tasa BCV).",
      "• Métodos: Zelle, Pago Móvil, Stripe.",
    ],
    "src/components/JsonLd.tsx"
  );

  drawCard(
    15 + featW + 6,
    curY,
    featW,
    44,
    "Sitemap, Robots & Manifest PWA",
    [
      "• sitemap.ts: Indexación de rutas estáticas y dinámicas.",
      "• robots.ts: Protección de rutas /admin y /api.",
      "• manifest.ts: PWA instalable en móviles.",
      "• OpenGraph & Twitter Cards de alta resolución.",
      "• Etiquetas geo.region: 'VE-A' y 'Caracas'.",
    ],
    "Archivos Nativos Next.js"
  );

  // ==========================================
  // PAGE 6: GUÍA DE OPERACIÓN & CHECKLIST
  // ==========================================
  doc.addPage();
  drawPageHeaderFooter(6, 6, "5. Operación & Contacto");

  curY = drawSectionTitle(24, "Puesta en Marcha", "Checklist de Operación para el Evento de Cata");

  const checklistItems = [
    ["1. Antes del Evento (Configuración de Catas)", [
      "• Acceder a /admin/catas y crear la fecha del evento con cupos (15-20 personas).",
      "• Cargar las 4 etiquetas de vino de colección, notas de cata y maridaje acordado con los aliados.",
      "• Compartir el enlace oficial en redes sociales y WhatsApp: https://el-origen-two.vercel.app/catas",
    ]],
    ["2. Durante la Venta (Monitoreo de Reservas)", [
      "• Monitorear en /admin/reservas las reservas confirmadas por tarjeta (Stripe) y Zelle/Pago Móvil.",
      "• Revisar la lista de restricciones dietéticas (sin gluten, vegano, frutos secos) para enviar a Maratea/Sowi.",
      "• Enviar recordatorio 24h antes a los inscritos con el código de vestimenta y ubicación del salón.",
    ]],
    ["3. En Puerta (Recepción & Check-in)", [
      "• El sommelier o anfitrión abre /admin/scanner en su smartphone o tablet.",
      "• Escanear el código QR de cada asistente (tarda menos de 1 segundo).",
      "• El sistema marca automáticamente la entrada como 'Validada' y previene reingresos no autorizados.",
    ]],
    ["4. Durante la Cata (Ficha Sensorial & Cierre)", [
      "• Los asistentes escanean el QR en mesa para abrir la Ficha Sensorial en /cata-en-vivo/[token].",
      "• Guiados por Belkis Croquer, registran notas aromáticas y califican cada vino sobre 100.",
      "• Al finalizar, cada invitado descarga su Diploma Oficial o lo comparte directamente en su Instagram Story.",
    ]],
  ];

  checklistItems.forEach(([title, bullets]) => {
    doc.setFillColor(248, 245, 246);
    doc.setDrawColor(...cGold);
    doc.setLineWidth(0.4);
    doc.roundedRect(15, curY, pageWidth - 30, 24, 2.5, 2.5, "FD");

    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...cPrimary);
    doc.text(title, 19, curY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...cTextDark);

    let bY = curY + 10.5;
    bullets.forEach((b) => {
      doc.text(b, 19, bY);
      bY += 4.2;
    });

    curY += 28;
  });

  curY += 4;

  // Contact Box
  doc.setFillColor(...cPrimary);
  doc.roundedRect(15, curY, pageWidth - 30, 28, 3, 3, "F");

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...cGold);
  doc.text("EL ORIGEN  •  EXPERIENCIAS DE CATA EN CARACAS", 105, curY + 7.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("WhatsApp Concierge: +58 414-1074007  |  Email: contacto@elorigen.com", 105, curY + 14, { align: "center" });
  doc.text("Repositorio GitHub: github.com/pauldavid2809-cloud/el-origen", 105, curY + 19, { align: "center" });
  doc.text("Sitio Web en Producción: https://el-origen-two.vercel.app", 105, curY + 24, { align: "center" });

  // Save PDF
  const outputDir = path.join(__dirname, "..", "public");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "Dossier-El-Origen-Caracas.pdf");
  const pdfBytes = doc.output("arraybuffer");
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

  console.log("PDF generado exitosamente en:", outputPath);
}

createDossierPDF();
