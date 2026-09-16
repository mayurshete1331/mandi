import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('mandi_user_id')?.value;
    const body = await req.json();

    const {
      categoryName,
      varietyName,
      subType,
      brand,
      packagingType,
      weightKg,
      initialStock = 0,
      purchaseCost,
      sellingPrice,
      supplier,
      notes,
      wholesalerId: bodyWholesalerId,
    } = body;

    const activeWholesalerId = bodyWholesalerId || sessionUserId;

    if (!activeWholesalerId) {
      return NextResponse.json({ error: 'Wholesaler session required' }, { status: 401 });
    }

    if (!categoryName || !varietyName || !brand || !packagingType) {
      return NextResponse.json(
        { error: 'Category, Variety, Brand, and Packaging are required' },
        { status: 400 }
      );
    }

    const weight = parseFloat(weightKg?.toString() || '0');
    const cost = parseFloat(purchaseCost?.toString() || '0');
    const price = parseFloat(sellingPrice?.toString() || '0');
    const qty = parseInt(initialStock?.toString() || '0', 10);

    if (weight <= 0 || cost <= 0 || price <= 0) {
      return NextResponse.json(
        { error: 'Weight, purchase cost, and selling rate must be greater than 0' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create Category
      let category = await tx.category.findFirst({
        where: { name: { equals: categoryName.trim() } },
      });
      if (!category) {
        category = await tx.category.create({
          data: {
            name: categoryName.trim(),
            icon: 'Package',
          },
        });
      }

      // 2. Find or create Variety
      let variety = await tx.variety.findFirst({
        where: {
          categoryId: category.id,
          name: { equals: varietyName.trim() },
        },
      });
      if (!variety) {
        variety = await tx.variety.create({
          data: {
            categoryId: category.id,
            name: varietyName.trim(),
            subType: subType?.trim() || null,
          },
        });
      }

      // 3. Check if SKU already exists for this wholesaler
      let sku = await tx.productSKU.findFirst({
        where: {
          varietyId: variety.id,
          wholesalerId: activeWholesalerId,
          brand: brand.trim(),
          packagingType: packagingType.trim(),
        },
        include: {
          variety: {
            include: { category: true },
          },
        },
      });

      if (sku) {
        // Update existing SKU stock and prices
        sku = await tx.productSKU.update({
          where: { id: sku.id },
          data: {
            currentStock: { increment: qty },
            purchaseCost: cost,
            sellingPrice: price,
          },
          include: {
            variety: {
              include: { category: true },
            },
          },
        });
      } else {
        // Create new SKU
        sku = await tx.productSKU.create({
          data: {
            varietyId: variety.id,
            wholesalerId: activeWholesalerId,
            brand: brand.trim(),
            packagingType: packagingType.trim(),
            weightKg: weight,
            currentStock: qty,
            purchaseCost: cost,
            sellingPrice: price,
          },
          include: {
            variety: {
              include: { category: true },
            },
          },
        });
      }

      // 4. Log inward entry if initial stock provided
      if (qty > 0) {
        await tx.inventoryLog.create({
          data: {
            skuId: sku.id,
            bagsAdded: qty,
            costPerBag: cost,
            supplier: supplier?.trim() || null,
            notes: notes?.trim() || 'New commodity initial inward',
          },
        });
      }

      return sku;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${result.brand} (${result.packagingType}) with ${result.currentStock} bags in godown!`,
      sku: result,
    });
  } catch (error: any) {
    console.error('New SKU creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
