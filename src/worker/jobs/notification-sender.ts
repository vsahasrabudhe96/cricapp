/**
 * Notification Processing Jobs
 * 
 * Handles:
 * - Creating notifications based on match events
 * - Sending email notifications via Resend
 * - Sending in-app notifications
 */

import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// Initialize Resend email client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM = process.env.EMAIL_FROM || 'CricApp <noreply@cricapp.com>';

type NotificationType = 'MATCH_START' | 'TOSS_RESULT' | 'PLAYING_XI' | 'MATCH_RESULT' | 'INNINGS_BREAK' | 'MILESTONE';

interface NotificationData {
  matchId: string;
  type: NotificationType;
  title: string;
  body: string;
  teamIds: string[];
}

/**
 * Create notifications for users who have favorited the teams
 */
export async function createMatchNotification(data: NotificationData) {
  console.log(`[Notifications] Creating ${data.type} notifications for match ${data.matchId}`);

  // Find users who have favorited any of the teams
  const favoriteUsers = await prisma.favoriteTeam.findMany({
    where: {
      teamId: { in: data.teamIds },
    },
    include: {
      user: {
        include: {
          notificationPrefs: {
            where: {
              type: data.type,
              enabled: true,
            },
          },
        },
      },
    },
  });

  // Dedupe users (might have favorited both teams)
  const uniqueUsers = new Map<string, typeof favoriteUsers[0]['user']>();
  for (const fav of favoriteUsers) {
    if (!uniqueUsers.has(fav.userId)) {
      uniqueUsers.set(fav.userId, fav.user);
    }
  }

  console.log(`[Notifications] Found ${uniqueUsers.size} users to notify`);

  // Create notifications for each user
  const notifications = [];
  
  for (const [userId, user] of uniqueUsers) {
    // Check user preferences
    const wantsInApp = user.notificationPrefs.some(
      (p) => p.channel === 'IN_APP' && p.enabled
    );
    const wantsEmail = user.notificationPrefs.some(
      (p) => p.channel === 'EMAIL' && p.enabled
    );

    // Create in-app notification
    if (wantsInApp) {
      notifications.push({
        userId,
        type: data.type,
        channel: 'IN_APP' as const,
        title: data.title,
        body: data.body,
        data: { matchId: data.matchId },
      });
    }

    // Create email notification
    if (wantsEmail) {
      notifications.push({
        userId,
        type: data.type,
        channel: 'EMAIL' as const,
        title: data.title,
        body: data.body,
        data: { matchId: data.matchId, email: user.email },
      });
    }
  }

  // Batch create notifications
  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        channel: n.channel,
        title: n.title,
        body: n.body,
        data: n.data,
      })),
    });

    console.log(`[Notifications] Created ${notifications.length} notifications`);
  }
}

/**
 * Process pending notifications (send emails)
 */
export async function processNotifications() {
  // Find unsent email notifications
  const pendingEmails = await prisma.notification.findMany({
    where: {
      channel: 'EMAIL',
      sentAt: null,
    },
    include: {
      user: true,
    },
    take: 50, // Process in batches
  });

  if (pendingEmails.length === 0) {
    return;
  }

  console.log(`[Notifications] Processing ${pendingEmails.length} pending emails`);

  for (const notification of pendingEmails) {
    await sendEmailNotification(notification);
  }
}

/**
 * Send a single email notification
 */
async function sendEmailNotification(notification: {
  id: string;
  title: string;
  body: string;
  user: { email: string; name: string | null };
  data: unknown;
}) {
  if (!resend) {
    console.log('[Notifications] Resend not configured, skipping email');
    await markNotificationSent(notification.id);
    return;
  }

  try {
    const matchId = (notification.data as { matchId?: string })?.matchId;
    const matchUrl = matchId 
      ? `${process.env.APP_URL || 'http://localhost:3000'}/matches/${matchId}`
      : `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: notification.user.email,
      subject: notification.title,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; 
                        border-radius: 6px; text-decoration: none; margin-top: 16px; }
              .footer { color: #6b7280; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🏏 CricApp</h1>
              </div>
              <div class="content">
                <h2>${notification.title}</h2>
                <p>${notification.body}</p>
                <a href="${matchUrl}" class="button">View Match</a>
              </div>
              <div class="footer">
                <p>You're receiving this because you have notifications enabled for this team.</p>
                <p><a href="${process.env.APP_URL}/settings/notifications">Manage notification preferences</a></p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    await markNotificationSent(notification.id);
    console.log(`[Notifications] Email sent to ${notification.user.email}`);
  } catch (error) {
    console.error(`[Notifications] Failed to send email to ${notification.user.email}:`, error);
  }
}

/**
 * Mark a notification as sent
 */
async function markNotificationSent(notificationId: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { sentAt: new Date() },
  });
}

