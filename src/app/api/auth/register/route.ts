import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, shopName, phoneNumber, password, address, role = 'KIRANA', wholesalerId } =
      await req.json();

    if (!name || !shopName || !phoneNumber || !password) {
      return NextResponse.json(
        { error: 'Name, Business/Shop name, Mobile number, and Password are required' },
        { status: 400 }
      );
    }

    // Check if phone number already registered
    const existing = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this mobile number is already registered' },
        { status: 400 }
      );
    }

    // WHOLESALER REGISTRATION
    if (role === 'WHOLESALER') {
      const newWholesaler = await prisma.user.create({
        data: {
          name,
          shopName,
          phoneNumber,
          password,
          address: address || 'APMC Mandi',
          role: 'WHOLESALER',
          status: 'ACTIVE',
        },
      });

      const { password: _, ...userData } = newWholesaler;

      const res = NextResponse.json({
        success: true,
        message: 'Wholesaler account created successfully!',
        user: userData,
        role: 'WHOLESALER',
      });

      // Set session cookie for immediate sign-in
      res.cookies.set('mandi_user_id', newWholesaler.id, {
        path: '/',
        httpOnly: false,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return res;
    }

    // KIRANA RETAILER REGISTRATION
    if (!wholesalerId) {
      // If no wholesaler selected, check if any wholesaler exists
      const anyWholesaler = await prisma.user.findFirst({
        where: { role: 'WHOLESALER', status: 'ACTIVE' },
      });

      if (!anyWholesaler) {
        return NextResponse.json(
          {
            error:
              'No Mandi wholesalers are registered yet. Please register as a Mandi Wholesaler first, or have your merchant register their firm.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Please select a primary Mandi wholesaler for your store' },
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
        { error: 'Selected Mandi wholesaler does not exist' },
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
      message: `Account request submitted successfully! Your account is pending verification and credit approval from ${wholesaler.shopName || wholesaler.name}.`,
      wholesalerName: wholesaler.shopName || wholesaler.name,
      userId: newKirana.id,
      role: 'KIRANA',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
