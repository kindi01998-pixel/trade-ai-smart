export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { images, symbol, timeframe, balance, risk, notes } = req.body;

    if (!images || !images.length) {
      return res.status(400).json({ error: "لم يتم إرسال صور." });
    }

    const content = [
      {
        type: "input_text",
        text: `
أنت مساعد لتحليل الشارتات المالية.

حلل الصور المرفقة للزوج ${symbol}.
فريم الدخول: ${timeframe}
رصيد الحساب: ${balance}$
المخاطرة: ${risk}%
ملاحظات المتداول: ${notes || "لا يوجد"}

افحص:
- الاتجاه العام
- Market Structure
- BOS / CHOCH
- Liquidity Sweep
- FVG
- Order Blocks
- مناطق الدعم والمقاومة

أعطني النتيجة بالعربية بشكل واضح:
1. الاتجاه
2. ماذا ترى على الشارت
3. سيناريو شراء
4. سيناريو بيع
5. متى الأفضل الانتظار
6. مستوى إلغاء الفكرة إن أمكن قراءته بوضوح من الصورة

لا تدّعي رؤية سعر أو مستوى غير واضح في الصور.
`
      },
      ...images.map(image => ({
        type: "input_image",
        image_url: image
      }))
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-sol",
        input: [{
          role: "user",
          content
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "حدث خطأ أثناء التحليل."
      });
    }

    return res.status(200).json({
      analysis: data.output_text
    });

  } catch (error) {
    return res.status(500).json({
      error: "حدث خطأ في السيرفر."
    });
  }
}
