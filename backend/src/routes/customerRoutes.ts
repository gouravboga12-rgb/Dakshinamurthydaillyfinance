import { Router } from 'express';
import { authenticateToken, requireCustomer } from '../middleware/auth';
import {
  getCustomerDashboard,
  getLoanDetails,
  getLoanHistory,
  getNotifications,
  markNotificationAsRead,
  requestLoan,
  payInstallment
} from '../controllers/customerController';

const router = Router();

// Apply auth and customer checks to all customer endpoints
router.use(authenticateToken);
router.use(requireCustomer);

router.get('/dashboard', getCustomerDashboard);
router.get('/loans', getLoanHistory);
router.get('/loans/:id', getLoanDetails);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationAsRead);

router.post('/request-loan', requestLoan);
router.post('/pay', payInstallment);

export default router;
