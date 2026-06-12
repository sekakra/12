export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server configuration error: API Key missing' });

  const { promptText, company, client, invnum, dir, currency } = req.body;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: { temperature: 0.95, topP: 0.95, maxOutputTokens: 8192 },
        contents: [{
          parts: [{
            text: `أنت خبير UI/UX ومصمم فواتير عالمي محترف محاكي لمنصات الابتكار مثل uiverse.io. المطلوب منك ابتكار كود HTML + CSS متكامل وصافي لنموذج فاتورة مستقرة. شروط برمجية صارمة: 1. أخرج كود HTML + CSS مدمج بالكامل يعيش داخل وسم <html>. 2. امنع إضافة أي شروحات أو علامات ميركداون (\`\`\`html). ابدأ مباشرة بـ <!DOCTYPE html> وانته بـ </html>. 3. التصميم يجب أن يكون مبتكراً وفريداً في كل مرة. 4. البيانات: الشركة: "${company}"، العميل: "${client}"، رقم الفاتورة: "${invnum}"، اتجاه النص: ${dir}، العملة: ${currency}. 5. الفكرة المطلوبة: ${promptText}`
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