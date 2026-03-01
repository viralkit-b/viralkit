import Groq from "groq-sdk";

type FeatureType = "instagram_captions" | "viral_hashtags" | "reel_hooks";

function getGroqClient() {
  const apiKey = (process.env.GROQ_API_KEY ?? "").trim();
  return new Groq({ apiKey });
}

const FEATURE_LABELS: Record<FeatureType, string> = {
  instagram_captions: "Instagram Captions",
  viral_hashtags: "Viral Hashtags",
  reel_hooks: "Reel Hooks",
};

function buildFeatureInstructions(featureType: FeatureType): string {
  switch (featureType) {
    case "instagram_captions":
      return "Generate 5 high-converting Instagram caption variations. Punchy, scroll-stopping, with strategic emojis and clear CTA. Format as a numbered list.";
    case "viral_hashtags":
      return "Generate 3 hashtag stacks (20 hashtags each) for Instagram reach. Mix broad, mid, and niche. Group as Stack 1, Stack 2, Stack 3.";
    case "reel_hooks":
      return "Generate 10 powerful reel hooks for the first 3 seconds. Under 12 words each, curiosity/urgency/bold promise. Numbered list.";
    default:
      return "";
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const apiKey = (process.env.GROQ_API_KEY ?? "").trim();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is not configured. Please add GROQ_API_KEY to .env.local and restart the server." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { prompt?: string; featureType?: FeatureType };
    const prompt = body.prompt?.trim();
    const featureType = body.featureType;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Please describe the content you want to create." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const allowed: FeatureType[] = ["instagram_captions", "viral_hashtags", "reel_hooks"];
    if (!featureType || !allowed.includes(featureType)) {
      return new Response(
        JSON.stringify({ error: "Invalid feature type." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const featureLabel = FEATURE_LABELS[featureType];
    const featureInstructions = buildFeatureInstructions(featureType);
    const systemPrompt =
      "You are a world-class Social Media Strategist specializing in high-converting, viral content. Write engaging, high-quality, viral-style outputs. Clear, natural language. No fluff.";
    const userPrompt = `Feature: ${featureLabel}\n\nCreator's description:\n${prompt}\n\nInstructions:\n${featureInstructions}`;

    const groq = getGroqClient();
    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    let completion: Awaited<ReturnType<typeof groq.chat.completions.create>> | null = null;
    let lastError: unknown = null;

    for (const model of models) {
      try {
        completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 800,
        });
        break;
      } catch (err) {
        lastError = err;
      }
    }

    // @ts-ignore
  const choices = (completion as any).choices;

  if (!choices || choices.length === 0) {
    return new Response(JSON.stringify({ error: "AI Response Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawContent = choices[0].message?.content;
  let content: string = "";

  if (typeof rawContent === "string") {
    content = rawContent;
  } else if (Array.isArray(rawContent)) {
    content = rawContent
      .map((part: any) => (typeof part === "string" ? part : (part as { text?: string })?.text || ""))
      .filter(Boolean)
      .join("\n");
  }

    if (!content?.trim()) {
      return new Response(
        JSON.stringify({ error: "AI returned empty response. Try with more detail." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ result: content.trim() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Groq /generate error:", error);
    const err = error as { status?: number; statusCode?: number; message?: string };
    const status = err?.status ?? err?.statusCode;
    const msg =
      status === 401
        ? "Invalid API key. Please check your GROQ_API_KEY in .env.local and restart the server."
        : "Something went wrong. Please try again.";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

