import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { skuId, bagsAdded, costPerBag, supplier, sellingPrice, notes } = await req.json();

    if (!skuId || !bagsAdded || bagsAdded <= 0) {
      return NextResponse.json(
        { error: 'Valid SKU and quantity (bags/tins) are required' },
        { status: 400 }
      );
    }

    const qty = parseInt(bagsAdded.toString(), 10);
    const cost = costPerBag ? parseFloat(costPerBag.toString()) : 0;
    const sellRate = sellingPrice ? parseFloat(sellingPrice.toString()) : undefined;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Log inward stock entry
      const log = await tx.inventoryLog.create({
        data: {
          skuId,
          bagsAdded: qty,
          costPerBag: cost,
          supplier: supplier || null,
          notes: notes || null,
        },
      });

      // 2. Increment stock on the SKU
      const updateData: any = {
        currentStock: {
          increment: qty,
        },
      };

      if (cost > 0) {
        updateData.purchaseCost = cost;
      }
      if (sellRate !== undefined && sellRate > 0) {
        updateData.sellingPrice = sellRate;
      }

      const updatedSku = await tx.productSKU.update({
        where: { id: skuId },
        data: updateData,
        include: {
          variety: {
            include: {
              category: true,
            },
          },
        },
      });

      return { log, updatedSku };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${qty} bags to godown stock`,
      data: result,
    });
  } catch (error: any) {
    console.error('Inventory inward error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
