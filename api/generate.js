export default async function handler(req, res) {
  // تفعيل الـ Headers لحل مشاكل الـ CORS ومنع الانهيار
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'خلف الكواليس: الـ GEMINI_API_KEY غير معرف في لوحة تحكم Vercel' });
  }

  // قراءة وتحليل البيانات وضمان عدم انهيار السيرفر لو كانت القراءة مكسورة
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { }
  }

  const { promptText, company, client, invnum, dir, currency } = body || {};

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: { temperature: 0.85, topP: 0.95, maxOutputTokens: 8192 },
        contents: [{
          parts: [{
            text: `أنت خبير UI/UX ومصمم فواتير عالمي محترف محاكي لمنصات الابتكار مثل uiverse.io. المطلوب منك ابتكار كود HTML + CSS متكامل وصافي لنموذج فاتورة مستقرة وأنيقة. 
            شروط برمجية صارمة جداً:
            1. أخرج كود HTML + CSS مدمج بالكامل يعيش داخل وسم <html>.
            2. امنع منعاً باتاً إضافة أي شروحات، مقدمات، نصوص جانبية، أو علامات ميركداون (\`\`\`html). ابدأ مباشرة بـ <!DOCTYPE html> وانته بـ </html>.
            3. قم بحقن هذه البيانات في التصميم البصري: الشركة: "${company || ''}"، العميل: "${client || ''}"، رقم الفاتورة: "${invnum || ''}"، اتجاه النص: ${dir || 'rtl'}، العملة: ${currency || 'SAR'}.
            4. الفكرة المطلوبة الملهمة للتصميم: ${promptText || 'Luxury Invoice Layout'}`
          }]
        }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}