import axios from 'axios';
import { Platform } from 'react-native';
import { store } from '../store';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    // When served from the unified backend, use relative URL (same origin)
    // If opened on the Expo dev server (port 8082), route API calls to Express backend (port 8081)
    if (typeof window !== 'undefined') {
      if ((process.env as any).EXPO_PUBLIC_API_URL) {
        return (process.env as any).EXPO_PUBLIC_API_URL;
      }
      if (window.location.port === '8082') {
        return 'http://localhost:8081/api';
      }
    }
    return '/api';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8081/api';
  }
  return 'http://localhost:8081/api';
};

// --- In-Memory Mock Database State ---
let mockUser: any = null;

let mockNotifications = [
  {
    id: 'notif-1',
    user_id: 'mock-customer-id-12345',
    title: 'Welcome to Dakshinamurthy Finance! 🎉',
    message: 'Your account registration has been approved. You can now track your active loans here.',
    type: 'system',
    is_read: 0,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif-2',
    user_id: 'mock-customer-id-12345',
    title: 'Daily Repayment Collected 💰',
    message: 'An installment of ₹200 was successfully collected today.',
    type: 'payment',
    is_read: 0,
    created_at: new Date().toISOString(),
  }
];

let mockLoan: any = null;

// Generate initial daily installments
let mockInstallments: any[] = [];
const generateInstallments = (loan: any) => {
  if (!loan) return [];
  const list = [];
  for (let i = 0; i < loan.duration_days; i++) {
    const dueDate = new Date(loan.created_at);
    dueDate.setDate(dueDate.getDate() + i + 1);
    const dueDateStr = dueDate.toISOString().split('T')[0];
    
    // Check if it's already paid (simulate 18 paid installments initially if active)
    const isPaid = loan.id === 'loan-mock-12345' && i < 18;
    list.push({
      id: `inst-${loan.id}-${i + 1}`,
      loan_id: loan.id,
      due_date: dueDateStr,
      status: isPaid ? 'Paid' : 'Unpaid',
      payment_date: isPaid ? new Date(dueDate).toISOString() : null,
    });
  }
  return list;
};

mockInstallments = generateInstallments(mockLoan);

// Custom Axios Adapter
const mockAdapter = (config: any): Promise<any> => {
  return new Promise((resolve) => {
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();
    
    let requestData: any = {};
    if (config.data) {
      try {
        requestData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      } catch (e) {
        requestData = {};
      }
    }
    
    console.log(`[MOCK API] ${method.toUpperCase()} ${url}`, requestData);

    const resolveJson = (data: any, status = 200) => {
      setTimeout(() => {
        resolve({
          data,
          status,
          statusText: status === 200 || status === 201 ? 'OK' : 'Created',
          headers: config.headers,
          config,
          request: {},
        });
      }, 400); // Visual loading state delay
    };

    // 1. Auth Register
    if (url.includes('/auth/register')) {
      mockUser = {
        fullName: requestData.full_name,
        mobileNumber: requestData.mobile_number,
        email: requestData.email || 'customer@gmail.com',
        occupation: requestData.occupation || 'Private employee',
        shopName: requestData.shop_name || 'Cognizant',
        address: requestData.address || 'Hyderabad',
      };
      
      resolveJson({
        message: 'Registration successful! You can now login.',
        user: {
          id: 'mock-customer-id-12345',
          full_name: mockUser.fullName,
          mobile_number: mockUser.mobileNumber,
          role: 'customer',
          status: 'approved',
        }
      }, 201);
      return;
    }

    // 2. Auth Login
    if (url.includes('/auth/login')) {
      const mobile = requestData.mobile_number || '7337401590';
      resolveJson({
        token: 'mock-jwt-token-xyz-123',
        user: {
          id: 'mock-customer-id-12345',
          full_name: mockUser?.fullName || 'Dakshinamurthy Customer',
          mobile_number: mobile,
          email: mockUser?.email || 'customer@gmail.com',
          role: 'customer',
          status: 'approved',
          occupation: mockUser?.occupation || 'Private Employee',
          shop_name: mockUser?.shopName || 'Cognizant',
          address: mockUser?.address || 'Hyderabad',
        }
      }, 200);
      return;
    }

    // 3. Customer Dashboard Summary
    if (url.includes('/customer/dashboard')) {
      const unreadCount = mockNotifications.filter(n => n.is_read === 0).length;
      resolveJson({
        summary: {
          hasActiveLoan: mockLoan !== null,
          loan: mockLoan,
          installmentsCount: mockLoan ? mockInstallments.length : 0,
          paidInstallmentsCount: mockLoan ? mockInstallments.filter(i => i.status === 'Paid').length : 0,
          remainingInstallmentsCount: mockLoan ? mockInstallments.filter(i => i.status === 'Unpaid').length : 0,
          progressPercentage: mockLoan ? Math.round((mockInstallments.filter(i => i.status === 'Paid').length / mockInstallments.length) * 100) : 0,
          paidAmount: mockLoan ? mockInstallments.filter(i => i.status === 'Paid').length * mockLoan.daily_installment : 0,
          nextDue: mockLoan ? (mockInstallments.find(i => i.status === 'Unpaid')?.due_date || null) : null,
          dueTodayAmount: mockLoan ? mockLoan.daily_installment : 0,
          unreadNotificationsCount: unreadCount,
        }
      }, 200);
      return;
    }

    // 4. Pay Installment
    if (url.includes('/customer/pay')) {
      if (mockLoan && mockLoan.status === 'Active') {
        // Find first unpaid installment
        const nextUnpaid = mockInstallments.find(i => i.status === 'Unpaid');
        if (nextUnpaid) {
          nextUnpaid.status = 'Paid';
          nextUnpaid.payment_date = new Date().toISOString();
          
          // Decrease remaining balance
          mockLoan.remaining_balance = Math.max(0, mockLoan.remaining_balance - mockLoan.daily_installment);
          if (mockLoan.remaining_balance === 0) {
            mockLoan.status = 'Completed';
            mockLoan.completion_date = new Date().toISOString();
          }

          // Add notification
          mockNotifications.unshift({
            id: 'notif-' + Math.random().toString(),
            user_id: 'mock-customer-id-12345',
            title: 'Repayment Successful! 💳',
            message: `A daily installment of ₹${mockLoan.daily_installment} has been cleared. Outstanding: ₹${mockLoan.remaining_balance}`,
            type: 'payment',
            is_read: 0,
            created_at: new Date().toISOString(),
          });
        }
      }
      resolveJson({ success: true, loan: mockLoan }, 200);
      return;
    }

    // 5. Apply / Request New Loan
    if (url.includes('/customer/request-loan')) {
      const amount = requestData.amount || 20000;
      const duration = requestData.duration_days || 50;
      const charges = Math.round(amount * 0.1);
      const daily = Math.round(amount / duration);

      mockLoan = {
        id: 'loan-req-' + Math.random().toString(36).substr(2, 9),
        customer_id: 'mock-customer-id-12345',
        approved_amount: amount,
        platform_charges: charges,
        amount_disbursed: amount - charges,
        daily_installment: daily,
        duration_days: duration,
        total_repayment: amount,
        remaining_balance: amount,
        status: 'Pending', // will show as pending on dashboard
        approval_date: null,
        completion_date: null,
        created_at: new Date().toISOString(),
      };

      mockInstallments = generateInstallments(mockLoan);

      // Add notification
      mockNotifications.unshift({
        id: 'notif-' + Math.random().toString(),
        user_id: 'mock-customer-id-12345',
        title: 'Loan Request Submitted 📋',
        message: `Your request for a loan of ₹${amount} is pending approval from the administrator.`,
        type: 'loan',
        is_read: 0,
        created_at: new Date().toISOString(),
      });

      resolveJson({ success: true, loan: mockLoan }, 200);
      return;
    }

    // 6. Specific Loan Details
    if (url.match(/\/customer\/loans\/.+/)) {
      resolveJson({
        loan: mockLoan,
        installments: mockInstallments,
      }, 200);
      return;
    }

    // 7. Loans List
    if (url.includes('/customer/loans')) {
      resolveJson(mockLoan ? [mockLoan] : [], 200);
      return;
    }

    // 8. Notifications List
    if (url.includes('/customer/notifications')) {
      resolveJson(mockNotifications, 200);
      return;
    }

    // 9. Mark Notification as Read
    if (url.includes('/customer/notifications/') && url.includes('/read')) {
      const parts = url.split('/');
      const idIdx = parts.indexOf('notifications') + 1;
      const notifId = parts[idIdx];
      
      mockNotifications = mockNotifications.map(n => 
        n.id === notifId ? { ...n, is_read: 1 } : n
      );
      
      resolveJson({ success: true }, 200);
      return;
    }

    resolveJson({ error: 'Mock endpoint route not matched.' }, 404);
  });
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // adapter: mockAdapter, // Disabled mock adapter to connect to real backend server
});

// Attach JWT token from store to requests
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
export { getBaseUrl };
