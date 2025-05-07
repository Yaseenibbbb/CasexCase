import { NextRequest, NextResponse } from 'next/server';

// Define the expected response structure from the external API
// NOTE: Adjusted based on observed raw data. We only define paths we need.
interface TheCompaniesApiRawCompany {
    domain?: {
        domain?: string;
    };
    about?: {
        name?: string;
    };
    assets?: {
        logoSquare?: {
            src?: string | null;
        };
    };
    // We don't need to define all the other fields
}

interface TheCompaniesApiResponse {
    companies: TheCompaniesApiRawCompany[];
    meta?: object; // Keep meta optional
}

// Define the structure expected by the frontend
interface CompanySearchResult {
  id: string;
  name: string;
  logo_url: string | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '10';

  if (!query) {
    return NextResponse.json({ error: 'Search query parameter "q" is required' }, { status: 400 });
  }

  const apiKey = process.env.COMPANIES_API_KEY;

  if (!apiKey) {
    console.error("COMPANIES_API_KEY environment variable not set.");
    return NextResponse.json({ error: 'API key configuration error' }, { status: 500 });
  }

  const externalApiUrl = `https://api.thecompaniesapi.com/v2/companies/by-name?name=${encodeURIComponent(query)}&size=${encodeURIComponent(limit)}`;

  try {
    const externalResponse = await fetch(externalApiUrl, {
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!externalResponse.ok) {
      const errorBody = await externalResponse.text();
      console.error(`Error fetching from TheCompaniesAPI: ${externalResponse.status} ${externalResponse.statusText}`, errorBody);
      return NextResponse.json({ error: `Failed to fetch data from external API. Status: ${externalResponse.status}` }, { status: externalResponse.status });
    }

    // Use 'any' temporarily for flexibility or define a more robust type if needed
    const data: TheCompaniesApiResponse = await externalResponse.json();

    // --- Data Transformation ---
    // Map the response using the correct nested paths
    const results: CompanySearchResult[] = data.companies.map(company => ({
        // Use optional chaining and provide fallbacks
        id: company.domain?.domain || `unknown-domain-${Math.random()}`, // Fallback ID
        name: company.about?.name || 'Unknown Company Name', // Fallback name
        logo_url: company.assets?.logoSquare?.src || null // Access nested logo, default to null
    })).filter(company => company.name !== 'Unknown Company Name'); // Filter out items where name extraction failed
    // --- End Data Transformation ---

    return NextResponse.json(results);

  } catch (error) {
    console.error("Error in /api/companies route:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 