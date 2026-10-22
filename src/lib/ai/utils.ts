import OpenAI from "openai";

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. Please add it to your .env.local file."
      );
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
  }

  return openaiClient;
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Error handling helper
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "AIError";
  }
}

export function handleAIError(error: unknown): AIError {
  // Check if it's an OpenAI APIError
  if (error && typeof error === "object") {
    if (error instanceof OpenAI.APIError) {
      return new AIError(
        error.message || "OpenAI API error",
        error.code || "api_error",
        error.status
      );
    }
    
    // Check for API error structure
    if ("code" in error && "message" in error) {
      const apiError = error as { code: string; message: string; status?: number };
      return new AIError(
        apiError.message || "OpenAI API error",
        apiError.code || "api_error",
        apiError.status
      );
    }
  }

  if (error instanceof Error) {
    return new AIError(error.message, "unknown_error");
  }

  return new AIError("An unknown error occurred", "unknown_error");
}

// Common prompt templates
export const PROMPT_TEMPLATES = {
  blog: {
    draft: `You are an expert content writer for a creative agency. Generate a blog post draft based on the following information:

Topic: {topic}
Keywords: {keywords}
Target Audience: {audience}
Tone: {tone}

Requirements:
- Write an engaging, informative blog post
- Include an SEO-optimized title
- Write a compelling excerpt (2-3 sentences)
- Structure content with headings and subheadings
- Use markdown formatting
- Aim for approximately {wordCount} words

Generate the blog post now:`,
    
    seo: `Optimize the following blog post for SEO:

Title: {title}
Content: {content}
Target Keywords: {keywords}

Provide:
1. An improved SEO-optimized title
2. An improved meta description/excerpt
3. Suggestions for internal linking opportunities
4. Suggestions for image alt text`,
    
    improve: `Review and improve the following blog post content:

{content}

Target Audience: {audience}
Tone: {tone}

Provide:
1. Improved version of the content
2. Specific suggestions for improvement
3. Areas that need more detail or clarification`,
  },

  socialMedia: {
    generate: `Create a {platform} post based on the following:

Content Theme: {theme}
Key Message: {message}
Target Audience: {audience}
Tone: {tone}
Call to Action: {cta}

Requirements:
- Platform: {platform}
- Character limit: {limit}
- Include relevant hashtags
- Make it engaging and shareable
- Match {platform} best practices

Generate the post:`,
    
    hashtags: `Suggest relevant hashtags for this {platform} post:

Content: {content}
Industry: {industry}
Target Audience: {audience}

Provide:
- 5-10 trending hashtags
- 3-5 niche-specific hashtags
- 2-3 branded hashtags (if applicable)`,
    
    repurpose: `Repurpose this content for {targetPlatform}:

Original Content: {content}
Original Platform: {sourcePlatform}
Target Platform: {targetPlatform}

Adapt the content to match {targetPlatform} best practices, tone, and format.`,
  },

  proposal: {
    ourWork: `Generate an "Our Work" section for a proposal based on:

Client Industry: {industry}
Project Type: {projectType}
Similar Projects: {similarProjects}

Create a compelling section that showcases relevant work and builds confidence.`,
    
    deliverables: `Generate a deliverables list for a {projectType} project:

Project Scope: {scope}
Client Needs: {needs}
Industry: {industry}

Provide a comprehensive, professional list of deliverables.`,
    
    timeline: `Estimate a realistic timeline for this project:

Deliverables: {deliverables}
Project Complexity: {complexity}
Team Size: {teamSize}

Provide:
- Overall timeline estimate
- Key milestones
- Dependencies`,
    
    investment: `Suggest an investment range for this project:

Project Type: {projectType}
Deliverables: {deliverables}
Complexity: {complexity}
Industry: {industry}
Timeline: {timeline}

Provide a professional investment summary.`,
  },

  contract: {
    clauses: `Generate appropriate contract clauses for:

Project Type: {projectType}
Industry: {industry}
Project Value: {value}
Timeline: {timeline}

Generate clauses for:
- Intellectual Property
- Payment Terms
- Liability
- Termination
- Confidentiality`,
    
    riskAssessment: `Assess potential risks and suggest protective clauses for:

Contract Terms: {terms}
Project Type: {projectType}
Industry: {industry}

Identify risks and suggest appropriate protective clauses.`,
  },
};
