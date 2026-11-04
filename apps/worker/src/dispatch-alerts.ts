import { isConsentActive, type PrismaClient } from '@gig/db';
import type { WhatsAppSender } from '@gig/shared';

const RETRY_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function dispatchPendingAlerts(prisma: PrismaClient, sender: WhatsAppSender) {
  const pending = await prisma.alert.findMany({
    where: { status: 'PENDING', channel: 'WHATSAPP' },
    orderBy: { id: 'asc' },
    include: {
      business: {
        select: {
          members: {
            where: { role: 'OWNER' },
            take: 1,
            select: { user: { select: { phone: true } } },
          },
        },
      },
    },
  });
  const summary = { sent: 0, skipped: 0, failed: 0, retrying: 0 };

  for (const alert of pending) {
    const phone = alert.business.members[0]?.user.phone;
    // O consentimento pode ter sido revogado depois de o alerta ser criado.
    if (!phone || !(await isConsentActive(prisma, alert.businessId, 'WHATSAPP_NOTIFICATIONS'))) {
      await prisma.alert.update({ where: { id: alert.id }, data: { status: 'SKIPPED' } });
      summary.skipped += 1;
      continue;
    }
    try {
      await sender.send(phone, alert.message);
      await prisma.alert.update({
        where: { id: alert.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      summary.sent += 1;
    } catch {
      // Fica pendente para reenvio, como no caso de queda de internet do servidor local.
      if (Date.now() - alert.createdAt.getTime() > RETRY_WINDOW_MS) {
        await prisma.alert.update({ where: { id: alert.id }, data: { status: 'FAILED' } });
        summary.failed += 1;
      } else {
        summary.retrying += 1;
      }
    }
  }
  return summary;
}
