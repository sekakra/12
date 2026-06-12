export default async function handler(req, res) {
  // تفعيل الـ CORS لتأمين قنوات الاتصال ومنع الحظر
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'مفتاح GEMINI_API_KEY غير معرّف في بيئة سيرفر Vercel' });

  // المعالجة الاحترافية للـ Stream وقراءة البيانات الخام لمنع خطأ الـ 500 للأبد
  let buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  let rawBody = Buffer.concat(buffers).toString();
  
  let payload = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : (req.body || {});
  } catch (e) {
    payload = req.body || {};
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
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}