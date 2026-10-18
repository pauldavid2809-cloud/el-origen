# Bot de WhatsApp · El Origen

Envía por WhatsApp lo que se aprueba en el panel:

- la **entrada con código QR** de una reserva de cata
  (**Admin → Reservas & Pagos → Aprobar y enviar QR**), y
- la **confirmación de un pedido de vinos**, como mensaje de texto
  (**Admin → Pedidos de vinos → Aprobar y enviar confirmación**).

Es el mismo esquema del bot del Congreso AMCJ: un WhatsApp normal vinculado como
"dispositivo" (librería Baileys) que corre en una computadora.

## Cómo funciona

1. Al aprobar una reserva o un pedido de vinos, el sitio deja el WhatsApp **en cola**.
2. El bot consulta la cola cada 4 segundos (`/api/whatsapp/queue`; entradas y pedidos de vinos
   van en la misma cola, del más antiguo al más reciente). Cada elemento trae un `kind`:
   - `kind: "tickets"` (reservas de catas): el bot envía **una imagen con código QR por persona**
     (una reserva de 3 cupos = 3 imágenes, para que cada invitado tenga la suya):
     - la primera imagen lleva el mensaje con los datos de la cata, el enlace a las entradas y las
       políticas de la experiencia (si el texto es muy largo, las políticas salen en un mensaje aparte);
     - las demás dicen "Entrada 2 de 3 · EO-XXXXX-2" (y el nombre del asistente, si el comprador lo puso).
   - `kind: "text"` (pedidos de vinos, código `EV-XXXXX`): el bot envía **un solo mensaje de texto**
     con el resumen del pedido y el enlace `/pedido/<token>`. No lleva imagen ni QR.
3. Avisa al sitio si se envió o falló; el panel muestra el estado de cada orden y si el bot está conectado.
   Si falla a mitad de una orden, el panel la marca como fallida: "Reenviar QR" (reservas) o
   "Reenviar confirmación" (pedidos de vinos) vuelve a enviarla completa.
   Si el mensaje **sí salió** pero el aviso al sitio falla (por ejemplo, sin internet justo en ese momento),
   el bot **no lo reenvía**: recuerda que ya lo envió y solo reintenta el aviso en cada consulta, para que el
   cliente no reciba el mismo mensaje varias veces.

No usa túneles ni direcciones públicas: es la computadora la que consulta al sitio, y el
panel del bot solo se abre desde esa misma computadora.

### Versión del bot y pedidos de vinos

El bot declara lo que sabe hacer con el encabezado `x-bot-caps: text` en cada consulta. **El sitio solo le
manda pedidos de vinos a un bot que lo declara**; a un bot anterior no se los manda (esos pedidos esperan
en la cola, con el WhatsApp "en cola del bot", sin afectar las entradas de las catas). Por eso, después de
actualizar el sitio hay que **actualizar también el bot**:

- Si lo usa en una computadora: genere un paquete nuevo con `npm run empaquetar-bot` (ver abajo), extráigalo
  y ábralo en lugar del anterior (copie la carpeta `auth_info/` si no quiere vincular de nuevo).
- Si está en Railway: vuelva a desplegar el servicio.

El panel (Admin → Correo y WhatsApp) avisa cuando el bot conectado es una versión anterior y no envía
pedidos de vinos.

Las respuestas automáticas a los "gracias" usan un texto neutro (sirve igual para una entrada que para un pedido).

### Protección contra bloqueos (igual que el congreso)

- Simula a una persona: abre el chat, muestra "escribiendo…" y espera antes de enviar.
- Pausa aleatoria de 5 a 9 segundos entre mensajes y un descanso de 15 a 25 segundos cada 4 envíos.
- Varía el saludo y el cierre de cada mensaje.
- Marca como leídos los mensajes que recibe y responde una vez los "gracias".
- Verifica que el número tenga WhatsApp antes de enviar.

## Paquete para el cliente (un clic, como el del congreso)

Para entregar el bot a quien lo va a usar, sin que tenga que editar nada:

```bash
npm run empaquetar-bot -- --secret=<la misma WHATSAPP_QUEUE_SECRET de Vercel>
```

Genera `dist/Bot-WhatsApp-ElOrigen.zip` con el `.env` ya configurado (sitio `https://elorigenvzla.com`;
otro con `--url=https://…`). El cliente extrae el .zip, hace doble clic en **`INICIAR-BOT.bat`**
(detecta Node.js, instala lo necesario la primera vez y abre el panel) y escanea el QR. La guía
para el cliente está en `LEEME-PRIMERO.txt`. El .zip lleva la clave del bot: compártalo solo con el
cliente (`dist/` no se sube a git).

## Puesta en marcha manual

1. **En Vercel**, agregue la variable `WHATSAPP_QUEUE_SECRET` con una clave larga y aleatoria
   y vuelva a desplegar.
2. Instale [Node.js LTS](https://nodejs.org/) en la computadora que tendrá el bot.
3. Copie esta carpeta `whatsapp-bot` a esa computadora.
4. Ejecute **`INICIAR-BOT.bat`** (Windows) o `./iniciar.sh` (Mac/Linux).
   La primera vez crea el archivo `.env`: escriba la misma `WHATSAPP_QUEUE_SECRET` y,
   si cambió, la dirección del sitio en `APP_URL`. Vuelva a ejecutar.
5. Se abre <http://localhost:3001>. En el teléfono de El Origen:
   **WhatsApp → ⋮ / Ajustes → Dispositivos vinculados → Vincular un dispositivo** y escanee el QR.
6. Listo: el panel dice "WhatsApp conectado". Use "Enviar prueba" con su número para comprobarlo.

La sesión queda guardada en `auth_info/`: al reiniciar la computadora no pide el QR otra vez.
Para cambiar de número use "Desvincular / usar otro número".

**Mientras el bot esté apagado, las entradas y los pedidos aprobados esperan en la cola** y se envían
apenas se encienda. El correo (con el QR en las reservas, con el resumen en los pedidos de vinos) sale igual desde el sitio.

## En Railway (siempre encendido, sin computadora)

1. Servicio nuevo desde este repositorio con **Root Directory** `/whatsapp-bot` (Railpack detecta Node y
   corre `npm start`). No le genere dominio público: el panel solo escucha en `127.0.0.1`.
2. Agréguele un **volumen** montado en `/data`: ahí queda la sesión de WhatsApp. Sin volumen, cada
   despliegue pediría vincular otra vez.
3. Variables: `APP_URL`, `WHATSAPP_QUEUE_SECRET` (igual a la de Vercel), `AUTH_DIR=/data/auth_info` y
   `PAIRING_PHONE` (el número de El Origen con código de país, ej. `584141074007`).
4. Para vincular el WhatsApp hay dos formas (elija una):
   - **Por QR (recomendado):** defina `PANEL_TOKEN` (clave larga y aleatoria: solo letras, números, `-` y `_`, mínimo 24; por ejemplo `openssl rand -hex 32`) y genere un
     dominio público al servicio. Abra `https://<dominio>/?key=<PANEL_TOKEN>` en una computadora, y en el
     teléfono: **WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo** y escanee el QR.
     Todo el panel exige esa clave (sin ella responde 404); el enlace queda en una cookie y se quita de la
     barra de direcciones. **Quien tenga el enlace puede vincular el WhatsApp: no lo comparta.** Al terminar,
     quite el dominio público (o cambie `PANEL_TOKEN`).
   - **Por código:** sin dominio público, defina `PAIRING_PHONE` y el bot imprime en los
     **logs** un `CÓDIGO DE VINCULACIÓN` de 8 caracteres para escribirlo en **WhatsApp → Dispositivos
     vinculados → Vincular un dispositivo → Vincular con el número de teléfono** (vale ~3 minutos; si vence,
     genera otro, hasta 4 veces por arranque).
5. Listo: el log dice `WhatsApp conectado` y el panel de administración (Correo y WhatsApp) muestra el bot
   conectado. La sesión sobrevive a reinicios y despliegues gracias al volumen.

Use solo **una** instancia a la vez con el mismo número (Railway o una computadora, no ambas).

## Recomendaciones

- Use un número dedicado a El Origen con algo de antigüedad y uso normal.
- La computadora debe quedar encendida y con internet durante la venta.
- WhatsApp no permite oficialmente bots en cuentas normales: con volúmenes pequeños y
  estas pausas el riesgo es bajo, pero existe. Para volumen alto conviene la API oficial de
  Meta (variables `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`), que el sitio usa
  con prioridad si están configuradas.

## Variables (`.env`)

| Variable | Descripción |
|---|---|
| `APP_URL` | Dirección del sitio publicado |
| `WHATSAPP_QUEUE_SECRET` | Igual a la de Vercel |
| `PORT` | Puerto del panel local (3001) |
| `POLL_SECONDS` | Cada cuántos segundos revisa la cola (4) |
| `AUTH_DIR` | Carpeta de la sesión de WhatsApp (por defecto `auth_info/`; en Railway `/data/auth_info`) |
| `PAIRING_PHONE` | Vincula con código de 8 caracteres en vez de QR (servidores sin pantalla) |
| `PANEL_TOKEN` | Publica el panel (QR) en la dirección del servicio, protegido con esta clave (letras, números, `-` y `_`; mín. 24) |
