// خريطة لتخزين عدد المحاولات في الذاكرة المؤقتة
const trackers = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(identifier: string, limit: number = 5, windowMs: number = 60000) {
  const now = Date.now();
  const record = trackers.get(identifier);

  // إذا انتهى الوقت، نعيد التعيين
  if (!record || now > record.expiresAt) {
    trackers.set(identifier, { count: 1, expiresAt: now + windowMs });
    return true; // مسموح
  }

  // إذا تجاوز الحد
  if (record.count >= limit) {
    return false; // ممنوع
  }

  // زيادة العداد
  record.count += 1;
  return true; // مسموح
}