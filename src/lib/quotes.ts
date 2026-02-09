export const quotes = {
  ar: [
    "الألم الذي تشعر به اليوم سيكون القوة التي تشعر بها غداً.",
    "لا تتوقف عندما تتعب، توقف عندما تنتهي.",
    "الانضباط هو الجسر بين الأهداف والإنجازات.",
    "جسمك يستطيع فعل أي شيء، عقلك هو من يحتاج للإقناع.",
    "العرق هو بكاء الدهون.",
    "التحفيز يجعلك تبدأ، العادات تجعلك تستمر.",
    "لا يهم كم تسير ببطء، طالما أنك لا تتوقف.",
    "القوة لا تأتي من القدرة الجسدية، بل من إرادة لا تقهر.",
    "اجعل تمارينك صعبة، لتكون حياتك سهلة.",
    "الراحة ليست كسلاً، بل هي شحن للطاقة.",
    "كل تمرين يقربك خطوة من النسخة الأفضل منك.",
    "لا تنتظر الفرصة، اخلقها بنفسك.",
    "الفشل هو مجرد فرصة للبدء من جديد بذكاء أكبر.",
    "ركز على النتيجة، وستتحمل الألم.",
    "أنت أقوى مما تعتقد.",
    "التعب يزول، والفخر يبقى.",
    "لا تقارن بدايتك بموسم حصاد الآخرين.",
    "استمر، حتى عندما يعتقد الجميع أنك ستستسلم.",
    "المستحيل كلمة موجودة فقط في قاموس الحمقى.",
    "يوم سيء؟ تمرين جيد يمحوه."
  ],
  en: [
    "The pain you feel today will be the strength you feel tomorrow.",
    "Don't stop when you're tired. Stop when you're done.",
    "Discipline is the bridge between goals and accomplishment.",
    "Your body can stand almost anything. It’s your mind that you have to convince.",
    "Sweat is fat crying.",
    "Motivation is what gets you started. Habit is what keeps you going.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Strength does not come from physical capacity. It comes from an indomitable will.",
    "Train hard so life becomes easy.",
    "Rest is not laziness, it's recharging.",
    "Every workout brings you one step closer to a better you.",
    "Don't wait for opportunity. Create it.",
    "Failure is simply the opportunity to begin again, this time more intelligently.",
    "Focus on the results, and you will endure the pain.",
    "You are stronger than you think.",
    "Pain is temporary. Pride is forever.",
    "Don't compare your beginning to someone else's middle.",
    "Keep going, even when everyone expects you to quit.",
    "Impossible is just an opinion.",
    "Bad day? Good workout clears it."
  ]
};

export function getRandomQuote(lang: 'ar' | 'en') {
  const list = quotes[lang];
  return list[Math.floor(Math.random() * list.length)];
}