export function buildCaptionPrompt(
  systemPrompt: string,
  toneKeywords: string[],
  imageDescription: string
): string {
  return `
You are a social media caption writer for an Instagram influencer.

PERSONA:
${systemPrompt}

TONE KEYWORDS: ${toneKeywords.join(', ')}

Write a caption for an Instagram post featuring this content:
${imageDescription}

Respond with ONLY a JSON object:
{
  "caption": "The Instagram caption (max 2200 chars, include line breaks, emojis where appropriate)",
  "topics": ["topic1", "topic2"],
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "alt_text": "Accessibility description of the image"
}

RULES:
- Stay completely in character per the persona above
- Caption should be engaging and authentic to the persona's voice
- Include 3-8 relevant hashtags (mix of popular and niche)
- Topics should be broad category keywords (e.g., "fitness", "skincare", "travel")
- Do not use generic AI phrases like "embrace the journey" or "living my best life" unless the persona specifically would
`;
}

export function buildCommentResponsePrompt(
  systemPrompt: string,
  postCaption: string,
  commentAuthor: string,
  commentBody: string,
  commentSentiment: string
): string {
  return `
You are responding to a comment on your Instagram post AS this influencer:

PERSONA:
${systemPrompt}

YOUR POST CAPTION:
${postCaption}

COMMENT FROM @${commentAuthor}:
"${commentBody}"

DETECTED SENTIMENT: ${commentSentiment}

Write a reply that:
1. Stays in character
2. Is appropriate for the sentiment (empathetic if negative, enthusiastic if positive)
3. Is concise (1-3 sentences)
4. Does NOT make promises or commitments on behalf of the brand
5. If it's a business inquiry, express interest and suggest DMs

Respond with ONLY a JSON object:
{
  "reply": "Your response text",
  "is_business_inquiry": true/false,
  "confidence": 0.0-1.0
}
`;
}

export function buildTopicDetectionPrompt(captions: string[]): string {
  return `
Analyze these ${captions.length} recent Instagram captions and extract recurring themes/topics.

CAPTIONS:
${captions.map((c, i) => `${i + 1}. ${c}`).join('\n\n')}

Respond with ONLY a JSON object:
{
  "topics": [
    {
      "topic": "skincare",
      "frequency": 5,
      "confidence": 0.92,
      "sample_keywords": ["moisturizer", "SPF", "routine"]
    }
  ]
}

Only include topics that appear in 3 or more captions.
`;
}

export function buildSentimentPrompt(text: string): string {
  return `
Analyze the sentiment of this Instagram comment:

"${text}"

Respond with ONLY a JSON object:
{
  "sentiment": "positive" | "neutral" | "negative" | "spam",
  "is_business_inquiry": true/false,
  "detected_intent": "string describing the intent, e.g. collaboration_request, complaint, question, compliment, spam",
  "priority_score": 0-100
}
`;
}
