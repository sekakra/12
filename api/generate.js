export default async function handler(req, res) {
  // 1. هندسة CORS آمنة: ضبط الـ Origin ديناميكياً لتجنب التعارض مع Credentials
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin === '*' ? '*' : origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // الاستجابة السريعة لطلبات الـ Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // حصر العمليات المسموحة في POST فقط
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 2. تأمين متغيرات البيئة وعدم تسريب التفاصيل للعميل
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing in the current Vercel environment.");
    return res.status(500).json({ error: 'Internal Server Configuration Error' });
  }

  // 3. الاعتماد على المعالجة التلقائية لـ Vercel/Next.js (إزالة كود الـ Stream الكارثي)
  const payload = req.body || {};
  
  // التحقق المبدئي من بنية الـ Payload لمنع الأخطاء غير المتوقعة
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ error: 'Invalid payload architecture' });
  }

  const { promptText, company, client, invnum, dir, currency } = payload;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: { temperature: 0.85, topP: 0.95, maxOutputTokens: 8192 },
        contents: [{
          parts: [{
            text: `أنت خبير UI/UX ومصمم فواتير عالمي محاكي لـ uiverse.io. المطلوب ابتكار كود HTML + CSS متكامل وصافي لنموذج فاتورة راقية.
            شروط برمجية صارمة:
            1. أخرج كود HTML + CSS مدمج بالكامل داخل وسم <html>.
            2. امنع الشروحات، أو نصوص جانبية، أو ميركداون (\`\`\`html). ابدأ بـ <!DOCTYPE html> وانته بـ </html>.
            3. قم بحقن البيانات الحالية: الشركة: "${company || ''}"، العميل: "${client || ''}"، رقم الفاتورة: "${invnum || ''}"، الاتجاه: ${dir || 'rtl'}، العملة: ${currency || 'SAR'}.
            4. الفكرة الإبداعية المطلوبة: ${promptText || 'Luxury Corporate Design'}`
          }]
        }]
      })
    });

    const data = await response.json();

    // 4. التحقق من استجابة مزود الذكاء الاصطناعي لمنع إرسال استجابات 200 لبيانات معطوبة
    if (!response.ok) {
      console.error("Gemini API Upstream Error:", data);
      return res.status(response.status).json({ error: 'Upstream AI provider error' });
    }

    return res.status(200).json(data);
    
  } catch (error) {
    // 5. تأمين الأخطاء: تسجيل الخطأ في سيرفرات Vercel دون تسريب رسالة الخطأ للمتصفح
    console.error("Execution Error:", error);
    return res.status(500).json({ error: 'Internal Server Error during execution' });
  }
}