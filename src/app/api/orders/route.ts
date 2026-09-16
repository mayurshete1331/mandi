import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('mandi_user_id')?.value;
    const queryUserId = searchParams.get('userId');
    const wholesalerId = searchParams.get('wholesalerId');
    const roleParam = searchParams.get('role');

    let whereClause: any = {};

    if (roleParam === 'WHOLESALER' || (!queryUserId && sessionUserId)) {
      // Check if session user is wholesaler
      const sessionUser = sessionUserId
        ? await prisma.user.findUnique({ where: { id: sessionUserId } })
        : null;

      if (sessionUser?.role === 'WHOLESALER') {
        whereClause.wholesalerId = sessionUser.id;
      } else if (queryUserId) {
        whereClause.userId = queryUserId;
        if (wholesalerId) whereClause.wholesalerId = wholesalerId;
      }
    } else if (queryUserId) {
      whereClause.userId = queryUserId;
      if (wholesalerId) whereClause.wholesalerId = wholesalerId;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        retailer: {
          select: {
            id: true,
            name: true,
            shopName: true,
            phoneNumber: true,
            address: true,
          },
        },
        wholesaler: {
          select: {
            id: true,
            name: true,
            shopName: true,
            phoneNumber: true,
            address: true,
          },
        },
        items: {
          include: {
            sku: {
              include: {
                variety: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { userId, wholesalerId, items, paymentMode = 'CREDIT' } = body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'User ID and non-empty items array are required' },
        { status: 400 }
      );
    }

    // Process order in a Prisma transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalBags = 0;
      let totalWeightKg = 0;
      const verifiedItems = [];

      for (const item of items) {
        const sku = await tx.productSKU.findUnique({
          where: { id: item.skuId },
        });

        if (!sku) {
          throw new Error(`Product SKU ${item.skuId} not found`);
        }

        // If wholesalerId wasn't passed, adopt from SKU
        if (!wholesalerId) {
          wholesalerId = sku.wholesalerId;
        } else if (wholesalerId !== sku.wholesalerId) {
          throw new Error('All items in one order must be supplied by the same Mandi wholesaler');
        }

        const qty = parseInt(item.quantity.toString(), 10);
        if (qty <= 0) continue;

        if (sku.currentStock < qty) {
          throw new Error(
            `Insufficient stock for ${sku.brand} (${sku.packagingType}). Available: ${sku.currentStock}, Requested: ${qty}`
          );
        }

        const lineTotal = sku.sellingPrice * qty;
        totalAmount += lineTotal;
        totalBags += qty;
        totalWeightKg += sku.weightKg * qty;

        verifiedItems.push({
          skuId: sku.id,
          quantity: qty,
          pricePerBag: sku.sellingPrice,
          totalPrice: lineTotal,
        });

        // Decrement stock in godown
        await tx.productSKU.update({
          where: { id: sku.id },
          data: {
            currentStock: {
              decrement: qty,
            },
          },
        });
      }

      if (verifiedItems.length === 0) {
        throw new Error('No valid items in order');
      }

      // Check WholesalerRetailerConnection for approval and credit
      const connection = await tx.wholesalerRetailerConnection.findUnique({
        where: {
          wholesalerId_retailerId: {
            wholesalerId,
            retailerId: userId,
          },
        },
      });

      if (!connection || connection.status !== 'ACTIVE') {
        throw new Error('You do not have an active approved purchasing account with this wholesaler');
      }

      if (paymentMode === 'CREDIT') {
        const availableCredit = connection.creditLimit - connection.currentBalance;
        if (totalAmount > availableCredit) {
          throw new Error(
            `Order total (₹${totalAmount.toLocaleString('en-IN')}) exceeds available credit (₹${availableCredit.toLocaleString('en-IN')}) with this wholesaler.`
          );
        }

        // Debit connection balance
        await tx.wholesalerRetailerConnection.update({
          where: { id: connection.id },
          data: {
            currentBalance: {
              increment: totalAmount,
            },
          },
        });
      }

      const orderNumber = `ORD-${Date.now().toString().slice(-5)}`;

      // Create Order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          wholesalerId,
          connectionId: connection.id,
          totalAmount,
          totalBags,
          totalWeightKg,
          status: 'NEW',
          paymentMode,
          items: {
            create: verifiedItems,
          },
        },
        include: {
          items: {
            include: {
              sku: {
                include: {
                  variety: true,
                },
              },
            },
          },
        },
      });

      // If credit purchase, create Khata Debit entry
      if (paymentMode === 'CREDIT') {
        const newBalance = connection.currentBalance + totalAmount;

        await tx.khataEntry.create({
          data: {
            userId,
            wholesalerId,
            connectionId: connection.id,
            type: 'DEBIT',
            amount: totalAmount,
            balanceAfter: newBalance,
            reference: orderNumber,
            notes: `Order #${orderNumber} (${totalBags} bags) placed on Mandi credit`,
          },
        });
      }

      return createdOrder;
    });

    return NextResponse.json({
      success: true,
      message: 'Order successfully created',
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 400 });
  }
}
