import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // body can be single: { skuId: string, sellingPrice: number }
    // or array: { updates: Array<{ skuId: string, sellingPrice: number }> }

    if (Array.isArray(body.updates)) {
      const operations = body.updates.map((item: { skuId: string; sellingPrice: number }) =>
        prisma.productSKU.update({
          where: { id: item.skuId },
          data: { sellingPrice: parseFloat(item.sellingPrice.toString()) },
        })
      );
      await prisma.$transaction(operations);
      return NextResponse.json({ success: true, updatedCount: body.updates.length });
    } else if (body.skuId && body.sellingPrice !== undefined) {
      const updated = await prisma.productSKU.update({
        where: { id: body.skuId },
        data: { sellingPrice: parseFloat(body.sellingPrice.toString()) },
      });
      return NextResponse.json({ success: true, sku: updated });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('Rate update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
