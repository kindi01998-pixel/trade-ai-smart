export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST فقط" });
  }

  try {
    const {
      images = [],
      symbol = "XAUUSD",
      timeframe = "M15",
      balance = "",
      risk = "",
      notes = ""
    } = req.body || {};

    if (!images.length) {
      return res.status(400).json({
        error: "ارفع صورة شارت واحدة على الأقل."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY غير موجود في Vercel."
      });
    }

    const content = [
      {
        type: "input_text",
        text: `
حلل صور الشارت المرفقة كمساعد تحليل تداول.

الزوج: ${symbol}
فريم الدخول: ${timeframe}
رصيد الحساب: ${balance}
المخاطرة: ${risk}%
ملاحظات المستخدم: ${notes || "لا يوجد"}

افحص:
- الاتجاه العام
- Market Structure
- BOS / CHOCH
- السيولة و Liquidity Sweep
- FVG
- Order Blocks
- مناطق الدعم والمقاومة
- توافق الفريمات
- هل توجد فرصة واضحة الآن أم الأفضل الانتظار

أعطني النتيجة بالعربية وبشكل مختصر وواضح.

استخدم هذا الترتيب:
الاتجاه:
السيولة:
البنية:
FVG / Order Block:
السيناريو:
منطقة الدخول المحتملة:
وقف الخسارة المنطقي:
الأهداف المحتملة:
نسبة المخاطرة إلى العائد:
القرار الفني: شراء / بيع / انتظار

لا تدّعي وجود شيء لا يظهر بوضوح في الصور.
إذا كانت الصور غير كافية، قل إن التحليل غير مكتمل.
`
      }
    ];

    for (const image of images) {
      content.push({
        type: "input_image",
        image_url: image,
        detail: "high"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-6-luna",
          input: [
            {
              role: "user",
              content
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي."
      });
    }

    let analysis = data.output_text;

    if (!analysis && Array.isArray(data.output)) {
      analysis = data.output
        .flatMap(item => item.content || [])
        .filter(item => item.type === "output_text")
        .map(item => item.text)
        .join("\n");
    }

    if (!analysis) {
      return res.status(500).json({
        error: "لم تصل نتيجة تحليل من الذكاء الاصطناعي."
      });
    }

    return res.status(200).json({
      analysis
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "حدث خطأ غير متوقع."
    });
  }
}
