/**
 * Offline Synchronization Queue Manager
 * Caches scan and collection events during cellular signal loss and syncs when online.
 */

import { updateBagStatus } from './api/bags';
import { insertAuditLog } from './api/auditLogs';

const QUEUE_KEY = 'ecotrace_offline_queue';

/** Queues an action for background synchronization */
export function queueAction(actionType, payload) {
  const queue = getQueue();
  queue.push({
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    type: actionType,
    payload,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Retrieves the list of currently queued actions */
export function getQueue() {
  const data = localStorage.getItem(QUEUE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/** Clears the queue entirely */
export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Attempts to process and sync all queued actions to Supabase.
 * Returns the count of successfully synchronized actions.
 */
export async function syncQueue(supabase, organizationId = null) {
  const queue = getQueue();
  if (queue.length === 0) return 0;
  
  let successCount = 0;
  const remaining = [];
  
  for (const item of queue) {
    try {
      if (item.type === 'GPS_CHECKIN') {
        const { userId, userName, lat, lng } = item.payload;
        await insertAuditLog(supabase, {
          userId,
          userName,
          action: 'DRIVER_CHECKIN',
          entity: 'CHECKIN',
          details: `Driver GPS Check-in: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Offline synced)`,
        }, organizationId);
      } 
      
      else if (item.type === 'BAG_COLLECTED') {
        const { bagId, barcode, weight, userId, userName, routeId, gps } = item.payload;
        
        // Update bag status to collected
        await updateBagStatus(supabase, bagId, 'collected', {
          weight: parseFloat(weight),
          collected_at: item.timestamp,
          collected_by: userId,
          route_id: routeId,
          gps_lat: gps?.lat || null,
          gps_lng: gps?.lng || null
        }, organizationId);

        // Record audit trail
        await insertAuditLog(supabase, {
          userId,
          userName,
          action: 'BAG_COLLECTED',
          entity: 'BAG',
          entityId: bagId,
          details: `Bag ${barcode} collected & weighed (${weight}kg) (Offline synced)`
        }, organizationId);
      }
      
      else if (item.type === 'BAG_WEIGHED') {
        const { bagId, barcode, weight, userId, userName } = item.payload;
        
        await updateBagStatus(supabase, bagId, 'collected', {
          weight: parseFloat(weight)
        }, organizationId);
        
        await insertAuditLog(supabase, {
          userId,
          userName,
          action: 'BAG_WEIGHED',
          entity: 'BAG',
          entityId: bagId,
          details: `Weight set to ${weight} kg for bag ${barcode} (Offline synced)`
        }, organizationId);
      }

      successCount++;
    } catch (err) {
      console.error(`Failed to sync offline item: ${item.id}`, err);
      // Keep in queue for retry later
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return successCount;
}
