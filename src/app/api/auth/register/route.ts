import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, shopName, phoneNumber, password, address, wholesalerId } = await req.json();

    if (!name || !shopName || !phoneNumber || !password || !wholesalerId) {
      return NextResponse.json(
        { error: 'All fields including selecting a wholesaler are required' },
        { status: 400 }
      );
    }

    // Check if phone number already registered
    const existing = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A store with this mobile number is already registered' },
        { status: 400 }
      );
    }

    // Validate wholesaler exists
    const wholesaler = await prisma.user.findUnique({
      where: { id: wholesalerId, role: 'WHOLESALER' },
      select: { name: true, shopName: true },
    });

    if (!wholesaler) {
      return NextResponse.json(
        { error: 'Selected wholesaler does not exist' },
        { status: 404 }
      );
    }

    // Create Kirana with PENDING_APPROVAL connection
    const newKirana = await prisma.user.create({
      data: {
        name,
        shopName,
        phoneNumber,
        password,
        address: address || null,
        role: 'KIRANA',
        status: 'ACTIVE',
        wholesalerConnections: {
          create: {
            wholesalerId,
            status: 'PENDING_APPROVAL',
            creditLimit: 0,
            currentBalance: 0,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      status: 'PENDING_APPROVAL',
      message: `Account request submitted successfully! Your account is pending approval from ${wholesaler.shopName || wholesaler.name}. Once accepted, your account will be activated.`,
      wholesalerName: wholesaler.shopName || wholesaler.name,
      userId: newKirana.id,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
