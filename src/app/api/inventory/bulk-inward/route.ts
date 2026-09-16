import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('mandi_user_id')?.value;
    const body = await req.json();

    const { items, wholesalerId: bodyWholesalerId } = body;
    const activeWholesalerId = bodyWholesalerId || sessionUserId;

    if (!activeWholesalerId) {
      return NextResponse.json({ error: 'Wholesaler session required' }, { status: 401 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array cannot be empty' }, { status: 400 });
    }

    const processed = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const row of items) {
        const catName = row.category?.toString().trim();
        const varName = row.variety?.toString().trim();
        const subType = row.subType?.toString().trim() || null;
        const brand = row.brand?.toString().trim();
        const pkg = row.packagingType?.toString().trim();
        const weight = parseFloat(row.weightKg?.toString() || '0');
        const bags = parseInt(row.bagsAdded?.toString() || '0', 10);
        const cost = parseFloat(row.purchaseCost?.toString() || '0');
        const price = parseFloat(row.sellingPrice?.toString() || '0');
        const supplier = row.supplier?.toString().trim() || null;
        const notes = row.notes?.toString().trim() || 'Bulk Excel Inward';

        if (!catName || !varName || !brand || !pkg || bags <= 0 || cost <= 0 || price <= 0) {
          continue; // skip invalid or empty rows
        }

        // 1. Find or create Category
        let category = await tx.category.findFirst({
          where: { name: { equals: catName } },
        });
        if (!category) {
          category = await tx.category.create({
            data: { name: catName, icon: 'Package' },
          });
        }

        // 2. Find or create Variety
        let variety = await tx.variety.findFirst({
          where: {
            categoryId: category.id,
            name: { equals: varName },
          },
        });
        if (!variety) {
          variety = await tx.variety.create({
            data: {
              categoryId: category.id,
              name: varName,
              subType,
            },
          });
        }

        // 3. Find or create SKU
        let sku = await tx.productSKU.findFirst({
          where: {
            varietyId: variety.id,
            wholesalerId: activeWholesalerId,
            brand,
            packagingType: pkg,
          },
        });

        if (sku) {
          sku = await tx.productSKU.update({
            where: { id: sku.id },
            data: {
              currentStock: { increment: bags },
              purchaseCost: cost,
              sellingPrice: price,
            },
          });
        } else {
          sku = await tx.productSKU.create({
            data: {
              varietyId: variety.id,
              wholesalerId: activeWholesalerId,
              brand,
              packagingType: pkg,
              weightKg: weight > 0 ? weight : 25,
              currentStock: bags,
              purchaseCost: cost,
              sellingPrice: price,
            },
          });
        }

        // 4. Record Inventory Log
        await tx.inventoryLog.create({
          data: {
            skuId: sku.id,
            bagsAdded: bags,
            costPerBag: cost,
            supplier,
            notes,
          },
        });

        results.push({
          skuId: sku.id,
          brand,
          packagingType: pkg,
          bagsAdded: bags,
          newStock: sku.currentStock,
        });
      }

      return results;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed and inwarded ${processed.length} commodity items from Excel!`,
      processedCount: processed.length,
      items: processed,
    });
  } catch (error: any) {
    console.error('Bulk inward error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
