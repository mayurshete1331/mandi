import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { phoneNumber, password } = await req.json();

    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        role: true,
        status: true,
        shopName: true,
        address: true,
        password: true,
        wholesalerConnections: {
          select: {
            id: true,
            wholesalerId: true,
            status: true,
            creditLimit: true,
            currentBalance: true,
            wholesaler: {
              select: {
                id: true,
                name: true,
                shopName: true,
                phoneNumber: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid phone number or password' },
        { status: 401 }
      );
    }

    // Check Approval Status for Kirana stores
    if (user.role === 'KIRANA') {
      const activeConnections = user.wholesalerConnections.filter((c) => c.status === 'ACTIVE');
      const pendingConnections = user.wholesalerConnections.filter((c) => c.status === 'PENDING_APPROVAL');

      if (activeConnections.length === 0) {
        if (pendingConnections.length > 0) {
          const wsName =
            pendingConnections[0].wholesaler?.shopName ||
            pendingConnections[0].wholesaler?.name ||
            'your wholesale dealer';
          return NextResponse.json(
            {
              error: `Your store account request is pending approval from ${wsName}. Once accepted, your account will be activated.`,
              pendingApproval: true,
              wholesalerName: wsName,
            },
            { status: 403 }
          );
        }

        return NextResponse.json(
          {
            error: 'No active wholesaler approval found for this store. Please contact your Mandi wholesaler.',
            rejected: true,
          },
          { status: 403 }
        );
      }
    }

    // Strip password before returning
    const { password: _, ...userData } = user;

    const res = NextResponse.json({
      success: true,
      user: userData,
    });

    // Set cookie for simple session
    res.cookies.set('mandi_user_id', user.id, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
