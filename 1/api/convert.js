export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server configuration error: API Key missing' });

  const { currentVisualCode, sys, sysName } = req.body;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: { temperature: 0.2, topP: 0.95, maxOutputTokens: 8192 },
        contents: [{
          parts: [{
            text: `أنت كبير مهندسي الحلول البرمجية والمؤسسية (Enterprise Solution Architect). المهمة: خذ كود الـ HTML الجمالي المرفق بالأسفل، وقم بإجراء هندسة عكسية شاملة وصارمة لاستبدال كافة الحقول والبيانات الثابتة ومصفوفات التكرار بما يتوافق برمجياً وصياغياً وبنيوياً بنسبة 100% مع معايير ولغة نظام: ${sysName}. محددات وقوانين هندسية: 1. لا تغير تنسيقات الـ CSS أو الهيكل الجمالي، فقط احقن متغيرات النظام ومنطق الربط الخاص به بدقة. 2. امنع كتابة أي شروحات نصية أو علامات ميركداون (\`\`\`). أخرج كود القالب الصافي النهائي الجاهز للحقن المباشر في خوادم النظام المستهدف. الكود الجمالي المراد تحويله:\n${currentVisualCode}`
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