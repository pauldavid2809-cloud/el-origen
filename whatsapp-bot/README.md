# Bot de WhatsApp · El Origen

Envía por WhatsApp la entrada con código QR cuando se aprueba un pago en el panel
(**Admin → Reservas & Pagos → Aprobar y enviar QR**). Es el mismo esquema del bot del
Congreso AMCJ: un WhatsApp normal vinculado como "dispositivo" (librería Baileys) que
corre en una computadora.

## Cómo funciona

1. Al aprobar una reserva, el sitio deja el WhatsApp **en cola**.
2. El bot consulta la cola cada 10 segundos (`/api/whatsapp/queue`) y envía **una imagen con
   código QR por persona** (una reserva de 3 cupos = 3 imágenes, para que cada invitado tenga la suya):
   - la primera imagen lleva el mensaje con los datos de la cata, el enlace a las entradas y las
     políticas de la experiencia (si el texto es muy largo, las políticas salen en un mensaje aparte);
   - las demás dicen "Entrada 2 de 3 · EO-XXXXX-2" (y el nombre del asistente, si el comprador lo puso).
3. Avisa al sitio si se envió o falló; el panel muestra el estado de cada orden y si el bot está conectado.
   Si falla a mitad de una orden, el panel la marca como fallida: "Reenviar QR" vuelve a enviarla completa.

No usa túneles ni direcciones públicas: es la computadora la que consulta al sitio, y el
panel del bot solo se abre desde esa misma computadora.

### Protección contra bloqueos (igual que el congreso)

- Simula a una persona: abre el chat, muestra "escribiendo…" y espera antes de enviar.
- Pausa aleatoria de 5 a 9 segundos entre mensajes y un descanso de 15 a 25 segundos cada 4 envíos.
- Varía el saludo y el cierre de cada mensaje.
- Marca como leídos los mensajes que recibe y responde una vez los "gracias".
- Verifica que el número tenga WhatsApp antes de enviar.

## Puesta en marcha

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

**Mientras el bot esté apagado, las entradas aprobadas esperan en la cola** y se envían
apenas se encienda. El correo con el QR sale igual desde el sitio.

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
| `POLL_SECONDS` | Cada cuántos segundos revisa la cola (10) |
