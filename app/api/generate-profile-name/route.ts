import { NextResponse } from 'next/server';

function generateNameFromFilters(categories: string[], retailers: string[], brands: string[]) {
  const parts = [];

  // Add category term
  if (categories.length > 0) {
    parts.push(categories[0].split(' ')[0]);
  }

  // Add retailer term
  if (retailers.length > 0) {
    parts.push(retailers.length === 1 ? 'Retail' : 'Multi-Retail');
  }

  // Add brand term
  if (brands.length > 0) {
    parts.push(brands.length === 1 ? 'Brand' : 'Multi-Brand');
  }

  // Add default if empty
  if (parts.length === 0) {
    parts.push('General');
  }

  // Add suffix
  parts.push('Segment');

  return parts.join(' ');
}

export async function POST(req: Request) {
  try {
    // Parse the request
    const body = await req.json();
    
    // Extract the categories, retailers, and brands
    const categories = (body.prompt.match(/Categories: (.*?)(?:\n|$)/)?.[1] || '').split(', ').filter(Boolean);
    const retailers = (body.prompt.match(/Retailers: (.*?)(?:\n|$)/)?.[1] || '').split(', ').filter(Boolean);
    const brands = (body.prompt.match(/Brands: (.*?)(?:\n|$)/)?.[1] || '').split(', ').filter(Boolean);

    // Generate the name
    const name = generateNameFromFilters(categories, retailers, brands);

    // Return the response
    return NextResponse.json({ name });
  } catch (err) {
    console.log('Error in API route:', err);
    return NextResponse.json({ name: 'New Segment' });
  }
} 