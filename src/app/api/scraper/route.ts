import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Valid URL is required (must start with http/https)' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Basic regex for email detection
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    
    // Also specifically look for mailto links to extract cleaner data
    const mailtoLinks: string[] = [];
    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const email = href.replace('mailto:', '').split('?')[0].trim();
      if (email) mailtoLinks.push(email);
    });

    const bodyText = $('body').text();
    const rawMatches = bodyText.match(emailRegex) || [];
    
    const allFound = [...mailtoLinks, ...rawMatches];

    // Deduplicate and clean
    const uniqueEmails = [...new Set(allFound.map(e => e.toLowerCase()))].filter(email => {
      return !email.endsWith('.png') && 
             !email.endsWith('.jpg') && 
             !email.endsWith('.gif') &&
             !email.endsWith('.webp') &&
             !email.endsWith('.css') &&
             !email.includes('sentry.io') &&
             !email.includes('example.com') &&
             email.length > 5;
    });

    return NextResponse.json({ 
      success: true, 
      emails: uniqueEmails,
      count: uniqueEmails.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Scraping failed' }, { status: 500 });
  }
}
