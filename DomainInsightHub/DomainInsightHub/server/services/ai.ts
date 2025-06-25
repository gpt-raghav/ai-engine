import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface DomainAnalysisResult {
  description: string;
  keywords: string[];
}

export interface PromptGenerationResult {
  prompts: Array<{
    content: string;
    category: string;
  }>;
}

export interface AIAnalysisResult {
  response: string;
  sentimentScore: number;
  responseTime: number;
  keywordRelevance: string[];
  performanceScore: number;
}

export async function analyzeDomainWithAI(domainName: string): Promise<DomainAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const prompt = `Analyze the domain "${domainName}" and provide:
1. A comprehensive description of what this domain likely represents
2. A list of relevant keywords that describe this domain's purpose, industry, or target audience

Respond in JSON format with the following structure:
{
  "description": "detailed description here",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      description: result.description || "Unable to analyze domain",
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
    };
  } catch (error) {
    // Check if it's a quota/billing error
    if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('billing')) {
      throw new Error(`OpenAI API quota exceeded. Please check your billing and usage limits at https://platform.openai.com/settings/billing`);
    }
    throw new Error(`Failed to analyze domain: ${error.message}`);
  }
}

export async function generatePrompts(
  domainName: string, 
  description: string, 
  keywords: string[], 
  category: string
): Promise<PromptGenerationResult> {
  try {
    const keywordsText = keywords.join(", ");
    
    const prompt = `Based on the domain "${domainName}" with description "${description}" and keywords [${keywordsText}], generate 3-4 AI prompts for the category "${category}".

Each prompt should be specific, actionable, and tailored to this domain's context.

Respond in JSON format:
{
  "prompts": [
    {
      "content": "prompt content here",
      "category": "${category}"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      prompts: Array.isArray(result.prompts) ? result.prompts : [],
    };
  } catch (error) {
    throw new Error(`Failed to generate prompts: ${error.message}`);
  }
}

export async function analyzeWithOpenAI(promptContent: string, keywords: string[]): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert business analyst. Provide detailed, actionable insights based on the given prompt. Include key findings, recommendations, and strategic considerations. Pay attention to any keywords mentioned and rate their relevance."
        },
        {
          role: "user", 
          content: promptContent
        }
      ],
    });

    const responseTime = Date.now() - startTime;
    const responseContent = response.choices[0].message.content || "";

    // Analyze sentiment score
    const sentimentScore = calculateSentimentScore(responseContent);
    
    // Check keyword relevance in response
    const keywordRelevance = analyzeKeywordRelevance(responseContent, keywords);
    
    // Calculate performance score based on response quality
    const performanceScore = calculatePerformanceScore(responseContent, sentimentScore, responseTime);

    return {
      response: responseContent,
      sentimentScore,
      responseTime,
      keywordRelevance,
      performanceScore,
    };
  } catch (error) {
    throw new Error(`OpenAI analysis failed: ${error.message}`);
  }
}

export async function analyzeWithGemini(promptContent: string, keywords: string[]): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Note: This is a placeholder for Gemini API integration
    // In a real implementation, you would use Google's Gemini API
    // For now, we'll simulate the response
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    const responseTime = Date.now() - startTime;
    
    // Simulated response - in production, replace with actual Gemini API call
    const simulatedResponse = `Gemini Analysis: Based on the provided prompt, here are the key insights and recommendations. The analysis suggests strong potential for market positioning and user engagement strategies. Keywords like ${keywords.slice(0, 2).join(', ')} show high relevance for strategic implementation.`;
    
    const sentimentScore = calculateSentimentScore(simulatedResponse);
    const keywordRelevance = analyzeKeywordRelevance(simulatedResponse, keywords);
    const performanceScore = calculatePerformanceScore(simulatedResponse, sentimentScore, responseTime);

    return {
      response: simulatedResponse,
      sentimentScore,
      responseTime,
      keywordRelevance,
      performanceScore,
    };
  } catch (error) {
    throw new Error(`Gemini analysis failed: ${(error as Error).message}`);
  }
}

function analyzeKeywordRelevance(text: string, keywords: string[]): string[] {
  const relevantKeywords: string[] = [];
  const textLower = text.toLowerCase();
  
  keywords.forEach(keyword => {
    // Check if keyword or related terms appear in the response
    const keywordLower = keyword.toLowerCase();
    if (textLower.includes(keywordLower) || 
        textLower.includes(keywordLower.replace(/\s+/g, '')) ||
        // Check for partial matches and related terms
        textLower.split(/\s+/).some(word => 
          word.includes(keywordLower) || keywordLower.includes(word)
        )) {
      relevantKeywords.push(keyword);
    }
  });
  
  return relevantKeywords;
}

function calculatePerformanceScore(text: string, sentimentScore: number, responseTime: number): number {
  // Base score from sentiment
  let score = sentimentScore;
  
  // Response length factor (longer, more detailed responses score higher)
  const lengthBonus = Math.min(20, Math.floor(text.length / 100));
  score += lengthBonus;
  
  // Response time factor (faster responses score higher)
  if (responseTime < 3000) score += 10; // Under 3 seconds
  else if (responseTime < 5000) score += 5; // Under 5 seconds
  
  // Content quality indicators
  const qualityWords = ['strategy', 'analysis', 'recommendation', 'insight', 'opportunity', 'potential', 'market', 'competitive', 'growth'];
  const qualityScore = qualityWords.filter(word => 
    text.toLowerCase().includes(word)
  ).length * 2;
  
  score += qualityScore;
  
  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, Math.round(score)));
}

function calculateSentimentScore(text: string): number {
  // Simple sentiment analysis based on positive/negative words
  const positiveWords = ['excellent', 'great', 'good', 'positive', 'strong', 'potential', 'opportunity', 'success', 'effective', 'valuable'];
  const negativeWords = ['poor', 'bad', 'negative', 'weak', 'problem', 'issue', 'challenge', 'difficulty', 'risk', 'concern'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
  });
  
  const totalSentimentWords = positiveCount + negativeCount;
  if (totalSentimentWords === 0) return 75; // Neutral default
  
  return Math.round(((positiveCount / totalSentimentWords) * 100));
}
