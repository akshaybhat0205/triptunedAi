import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
});
const MODEL_NAME = "gemini-3.5-flash-lite";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const image = data.get("image");
  const text = data.get("text")?.toString() || "";
  const additionalPrompt = data.get("additionalPrompt")?.toString() || "";
  const category = data.get("category")?.toString() || "tourist spots";
  const mode = data.get("mode")?.toString() || "identify";

  if (mode === "related") {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [
          `You are generating a travel recommendations list for the location described below. Return exactly 6 to 8 items, one per line, in this exact format:\nName: Short description\nDo not use bullets, markdown headings, numbering, or bold text. Use plain text only. Base the suggestions strictly on the following location details and the requested category: ${category}. The location is: ${text}`,
        ],
      });

      const relatedQuestions = (response.text || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return NextResponse.json({ relatedQuestions });
    } catch (error) {
      console.error("Error generating related places:", error);
      return NextResponse.json(
        { error: getFriendlyErrorMessage(error) },
        { status: 429 }
      );
    }
  }

  if (mode === "gps" || mode === "name") {
    try {
      const prompt =
        mode === "gps"
          ? `You are helping a travel app. For the GPS location described below, return two sections in plain text only. First, write a short paragraph describing the location. Second, write a nearby places section with 6 to 8 items in this exact format:\nName: Short description\nDo not use bullets, numbering, or bold text. Category: ${category || "EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE"}. Location: ${text}`
          : `You are helping a travel app. For the place name described below, return two sections in plain text only. First, write a short paragraph describing the place. Second, write a nearby places section with 6 to 8 items in this exact format:\nName: Short description\nDo not use bullets, numbering, or bold text. Category: ${category || "tourist spots"}. Place name: ${text}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: [prompt],
      });

      return NextResponse.json({ result: response.text });
    } catch (error) {
      console.error(
        mode === "gps" ? "Error generating GPS response:" : "Error generating name response:",
        error,
      );
      return NextResponse.json(
        { error: getFriendlyErrorMessage(error) },
        { status: 429 }
      );
    }
  }

  if (!(image instanceof File) && !text) {
    return NextResponse.json({ error: "No image or text provided" }, { status: 400 });
  }

  try {
    const prompt = text
      ? `Identify the place based on the following description and provide a paragraph of information ${additionalPrompt}: ${text}`
      : `Identify the place in the image and provide information ${additionalPrompt}`;

    const imagePart = image instanceof File ? await fileToGenerativePart(image) : null;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: imagePart ? [prompt, imagePart] : [prompt],
    });

    return NextResponse.json({ result: response.text });
  } catch (error) {
    console.error("Error identifying place:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: getFriendlyErrorMessage(error) },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "An unknown error occurred while identifying the place" },
      { status: 500 }
    );
  }
}

function getFriendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.toLowerCase().includes("quota") ||
    message.toLowerCase().includes("resource_exhausted") ||
    message.toLowerCase().includes("429")
  ) {
    return "Gemini API quota exceeded. Please wait a few minutes and try again.";
  }

  return message;
}

async function fileToGenerativePart(file: File): Promise<{
  inlineData: { data: string; mimeType: string };
}> {
  const arrayBuffer = await file.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString("base64");

  return {
    inlineData: {
      data: base64String,
      mimeType: file.type,
    },
  };
}
