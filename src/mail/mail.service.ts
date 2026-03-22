import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private makeTransporter() {
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMeetingInvitation(
    emails: string[],
    meeting: { title: string; date: string; startTime: string; location: string; description?: string },
  ): Promise<{ sent: number; failed: number }> {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error(
        'Configuración de correo no disponible. Configure las variables MAIL_USER y MAIL_PASS en el servidor.',
      );
    }

    const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const MONTHS_UPPER = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

    const dateObj = new Date(meeting.date + 'T12:00:00');
    const year = dateObj.getFullYear();
    const dayName = DAYS_ES[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const monthLong = MONTHS_ES[dateObj.getMonth()];
    const monthUpper = MONTHS_UPPER[dateObj.getMonth()];

    const [h, m] = meeting.startTime.split(':').map(Number);
    const ampm = h >= 12 ? 'p.m.' : 'a.m.';
    const h12 = h % 12 || 12;
    const time12 = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;

    const agendaItems = meeting.description
      ? meeting.description.split('\n').map((l) => l.trim()).filter(Boolean)
      : [];
    const allItems = [
      'Lista de asistencia y verificación de quórum.',
      ...agendaItems,
      'Acuerdos y cierre.',
    ];
    const agendaHtml = allItems.map((i) => `<li style="margin-bottom:4px">${i}</li>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:#3d6b4f;padding:28px 32px;text-align:center">
      <p style="margin:0;color:#c8e6c9;font-size:13px;letter-spacing:1px;text-transform:uppercase">Asamblea Vecinal Ordinaria</p>
      <h1 style="margin:6px 0 4px;color:#fff;font-size:20px;font-weight:700">FRACCIONAMIENTO<br>"PRIVADAS DEL PARQUE"</h1>
      <p style="margin:0;color:#a5d6a7;font-size:15px;font-weight:600">${monthUpper} ${year}</p>
    </div>
    <div style="padding:28px 32px">
      <p style="font-size:15px;line-height:1.7;color:#333">
        Por medio del presente, se convoca a los vecinos del Fraccionamiento "Privadas del Parque",
        para el <strong>${dayName} ${dayNum} de ${monthLong} de ${year}</strong>,
        en <strong>${meeting.location}</strong> a las <strong>${time12}</strong>.
        La junta vecinal se desarrollará conforme al siguiente orden del día:
      </p>
      <ul style="font-size:14px;line-height:1.6;color:#444;padding-left:20px">
        ${agendaHtml}
      </ul>
      <p style="font-size:13px;color:#666;font-style:italic;border-left:3px solid #3d6b4f;padding-left:12px;margin-top:20px">
        Nota: Se les reitera que los acuerdos tomados en la junta son de aplicación general.
      </p>
      <div style="text-align:center;margin-top:28px">
        <p style="color:#555;font-size:14px;margin:0">Agradecemos su puntual asistencia y quedamos de usted.</p>
        <p style="color:#3d6b4f;font-weight:700;font-size:15px;margin:8px 0 0">«Mesa Directiva de Vecinos ${year}»</p>
      </div>
    </div>
    <div style="background:#f8f8f8;padding:12px 32px;text-align:center;border-top:1px solid #eee">
      <p style="margin:0;font-size:11px;color:#999">Privadas del Parque — Sistema de Gestión Vecinal</p>
    </div>
  </div>
</body>
</html>`;

    const from =
      process.env.MAIL_FROM ||
      `Mesa Directiva Privadas del Parque <${process.env.MAIL_USER}>`;
    const subject = `Convocatoria: ${meeting.title} — ${dayNum} de ${monthLong} de ${year}`;
    const transporter = this.makeTransporter();

    let sent = 0;
    let failed = 0;
    for (const email of emails) {
      try {
        await transporter.sendMail({ from, to: email, subject, html });
        sent++;
      } catch (err) {
        this.logger.error(`Error enviando correo a ${email}: ${err}`);
        failed++;
      }
    }
    return { sent, failed };
  }
}
