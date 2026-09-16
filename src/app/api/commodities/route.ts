import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase();
    const wholesalerId = searchParams.get('wholesalerId');

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        varieties: {
          include: {
            skus: {
              where: wholesalerId ? { wholesalerId } : undefined,
              orderBy: { weightKg: 'asc' },
            },
          },
        },
      },
    });

    // Prune varieties that have 0 SKUs for this wholesaler
    let filtered = categories
      .map((cat) => ({
        ...cat,
        varieties: cat.varieties.filter((v) => v.skus.length > 0),
      }))
      .filter((cat) => cat.varieties.length > 0);

    // If search term provided, filter
    if (search) {
      filtered = filtered
        .map((cat) => {
          const matchingVarieties = cat.varieties.filter((v) => {
            const vMatches =
              v.name.toLowerCase().includes(search) ||
              (v.subType && v.subType.toLowerCase().includes(search));
            const skuMatches = v.skus.some(
              (s) =>
                s.brand.toLowerCase().includes(search) ||
                s.packagingType.toLowerCase().includes(search)
            );
            return vMatches || skuMatches;
          });
          return { ...cat, varieties: matchingVarieties };
        })
        .filter((cat) => cat.varieties.length > 0 || cat.name.toLowerCase().includes(search));
    }

    return NextResponse.json({ categories: filtered });
  } catch (error: any) {
    console.error('Commodities fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
