export interface CaptionResult {
  caption: string;
  topics: string[];
  hashtags: string[];
  alt_text: string;
}

export interface CommentResponseResult {
  reply: string;
  is_business_inquiry: boolean;
  confidence: number;
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'spam';
  is_business_inquiry: boolean;
  detected_intent: string;
  priority_score: number;
}

export interface TopicDetectionResult {
  topics: Array<{
    topic: string;
    frequency: number;
    confidence: number;
    sample_keywords: string[];
  }>;
}

export function parseCaptionResponse(text: string): CaptionResult {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      caption: String(parsed.caption ?? ''),
      topics: Array.isArray(parsed.topics) ? parsed.topics.map(String) : [],
      hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map(String) : [],
      alt_text: String(parsed.alt_text ?? ''),
    };
  } catch {
    return { caption: '', topics: [], hashtags: [], alt_text: '' };
  }
}

export function parseCommentResponse(text: string): CommentResponseResult {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      reply: String(parsed.reply ?? ''),
      is_business_inquiry: Boolean(parsed.is_business_inquiry),
      confidence: Number(parsed.confidence ?? 0),
    };
  } catch {
    return { reply: '', is_business_inquiry: false, confidence: 0 };
  }
}

export function parseSentimentResponse(text: string): SentimentResult {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      sentiment: (['positive', 'neutral', 'negative', 'spam'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral') as SentimentResult['sentiment'],
      is_business_inquiry: Boolean(parsed.is_business_inquiry),
      detected_intent: String(parsed.detected_intent ?? ''),
      priority_score: Math.max(0, Math.min(100, Number(parsed.priority_score ?? 0))),
    };
  } catch {
    return { sentiment: 'neutral', is_business_inquiry: false, detected_intent: '', priority_score: 0 };
  }
}

export function parseTopicDetection(text: string): TopicDetectionResult {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      topics: Array.isArray(parsed.topics)
        ? parsed.topics.map((t: Record<string, unknown>) => ({
            topic: String(t.topic ?? ''),
            frequency: Number(t.frequency ?? 0),
            confidence: Number(t.confidence ?? 0),
            sample_keywords: Array.isArray(t.sample_keywords)
              ? t.sample_keywords.map(String)
              : [],
          }))
        : [],
    };
  } catch {
    return { topics: [] };
  }
}
