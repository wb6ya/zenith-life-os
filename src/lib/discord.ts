const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function sendDiscordMessage(message: string, type: 'info' | 'warning' | 'alert' = 'info') {
  if (!WEBHOOK_URL) {
    console.error("❌ No Discord Webhook URL found");
    return;
  }

  // تحديد اللون بناءً على نوع الرسالة
  let color = 3447003; // Blue (Info)
  if (type === 'warning') color = 16776960; // Yellow
  if (type === 'alert') color = 15158332; // Red

  const payload = {
    username: "Zenith OS System",
    avatar_url: "https://i.imgur.com/4M34hi2.png", // صورة رمزية للنظام (يمكنك تغييرها)
    embeds: [
      {
        title: type === 'alert' ? "🚨 URGENT ACTION REQUIRED" : "📢 SYSTEM UPDATE",
        description: message,
        color: color,
        footer: {
          text: `Zenith OS • ${new Date().toLocaleTimeString()}`,
        },
      },
    ],
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("✅ Discord Notification Sent");
  } catch (error) {
    console.error("💥 Failed to send Discord notification:", error);
  }
}