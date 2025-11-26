import * as cron from 'node-cron';
import {rtdb} from './firebase';


export function registerPlanner(){

cron.schedule('* * * * *', async () => {
    const now = Date.now();
    
    // 1. Query jobs due now or in the past
    const ref = rtdb.ref('pending_jobs');
    const snapshot = await ref.orderByChild('triggerTime').endAt(now).once('value');

    if (!snapshot.exists()) return;

    const updates = {};

    snapshot.forEach((child) => {
        const job = child.val();
        
        // 2. EXECUTE YOUR EVENT LOGIC HERE
        // e.g. send push notification, update user balance, etc.
        console.log(`Processing event for user ${job.userId}`);

        // 3. Queue for deletion so it doesn't run twice
        // updates[child.key] = null;
    });

    // 4. Atomic cleanup
    await ref.update(updates);
});
}