import cron from 'node-cron';
import { checkLowStock, checkExpiringMedicines } from '../controllers/notificationController.js';
import { checkAndUpdateExpiredMedicines } from '../services/inventoryService.js';

// Daily at 8 AM UTC
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily scheduled jobs at:', new Date().toLocaleString());
  try {
    await checkLowStock();
    await checkExpiringMedicines();
    const expired = await checkAndUpdateExpiredMedicines();
    if (expired.modifiedCount > 0) {
      console.log(`Marked ${expired.modifiedCount} medicines/batches as expired`);
    }
  } catch (error) {
    console.error('Error running scheduled jobs:', error);
  }
}, { timezone: 'UTC' });

// Run once on startup (after 5s delay for DB connection)
setTimeout(async () => {
  console.log('Running initial scheduled jobs check...');
  try {
    await checkLowStock();
    await checkExpiringMedicines();
    await checkAndUpdateExpiredMedicines();
  } catch (error) {
    console.error('Error running initial jobs:', error);
  }
}, 5000);

console.log('Scheduled jobs initialized');
