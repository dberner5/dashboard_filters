import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  return NextResponse.json({ summary: "Placeholder for AI analysis" });
  
    if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
  }

  try {
    const { chartData } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: `As a market analyst, provide a one-sentence summary of the key insight from this market share data: ${JSON.stringify(chartData)}. Focus on the largest segments and their relative positions.`
      }],
      temperature: 0.5,
      max_tokens: 100
    });
    console.log(response.choices[0].message.content);
    return NextResponse.json({ summary: response.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to analyze data' }, { status: 500 });
  }
} 