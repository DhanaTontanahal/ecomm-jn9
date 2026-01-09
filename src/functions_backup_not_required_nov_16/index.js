// Cloud Functions for Firebase (Node 18+)
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

/**
 * Auto-assign a delivery person on order creation.
 * Region pinned so both functions always show together in Console.
 */
export const autoAssignDeliveryOnOrderCreate = onDocumentCreated(
  { document: "orders/{orderId}", region: "us-central1" },
  async (event) => {
    const orderSnap = event.data;
    if (!orderSnap) return;
    const order = orderSnap.data();

    // If already assigned (retries / replays), skip
    if (order?.deliveryAssignee?.id) {
      console.log("[autoAssign] skip; already assigned", { orderId: event.params.orderId });
      return;
    }

    // Fetch settings
    const settingsRef = db.doc("settings/app");
    const settingsDoc = await settingsRef.get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    if (!settings?.autoAssignDelivery) {
      console.log("[autoAssign] feature off in settings");
      return;
    }

    // Helper: load a delivery boy by id and ensure active
    const getActiveById = async (id) => {
      if (!id) return null;
      const ref = db.collection("deliveryBoys").doc(id);
      const snap = await ref.get();
      if (!snap.exists) return null;
      const d = snap.data();
      if (!d?.isActive) return null;
      return { id: snap.id, ...d };
    };

    // 1) Prefer default if set and active
    let chosen = await getActiveById(settings.defaultDeliveryBoyId);

    // 2) Otherwise pick least-loaded active delivery boy
    if (!chosen) {
      const qSnap = await db
        .collection("deliveryBoys")
        .where("isActive", "==", true)
        .get();
      const records = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!records.length) {
        console.warn("[autoAssign] no active deliveryBoys found");
        return;
      }
      records.sort((a, b) => (a.assignedCount || 0) - (b.assignedCount || 0));
      chosen = records[0];
    }

    if (!chosen) return;

    // Transaction: set assignment + increment counter
    const orderRef = orderSnap.ref;
    const boyRef = db.collection("deliveryBoys").doc(chosen.id);

    await db.runTransaction(async (tx) => {
      const boyDoc = await tx.get(boyRef);
      if (!boyDoc.exists || boyDoc.data()?.isActive !== true) {
        throw new Error("Delivery boy no longer active.");
      }

      tx.update(orderRef, {
        deliveryAssignee: {
          id: chosen.id,
          name: chosen.name,
          phone: chosen.phone,
        },
        assignedAt: FieldValue.serverTimestamp(),
      });

      tx.update(boyRef, {
        assignedCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    console.log("[autoAssign] assigned", {
      orderId: event.params.orderId,
      deliveryBoyId: chosen.id,
    });
  }
);

/**
 * Deduct inventory & write stockTrail on order creation.
 * Idempotent via order.inventoryAdjusted flag set in the same tx.
 */
export const deductInventoryOnOrderCreate = onDocumentCreated(
  { document: "orders/{orderId}", region: "us-central1" },
  async (event) => {
    const orderSnap = event.data;
    if (!orderSnap) return;

    const orderRef = orderSnap.ref;
    const orderId = event.params.orderId;

    await db.runTransaction(async (tx) => {
      // Re-read inside the tx (consistency/idempotency)
      const fresh = await tx.get(orderRef);
      if (!fresh.exists) return;

      const order = fresh.data() || {};
      const items = Array.isArray(order.items) ? order.items : [];

      // If already adjusted (due to retries), bail out safely
      if (order.inventoryAdjusted === true) {
        console.log("[deduct] skip; already adjusted", { orderId });
        return;
      }

      if (!items.length) {
        // Mark as adjusted anyway to avoid retries looping forever
        tx.update(orderRef, {
          inventoryAdjusted: true,
          inventoryAdjustedAt: FieldValue.serverTimestamp(),
        });
        console.log("[deduct] no items; marked adjusted", { orderId });
        return;
      }

      // Collect all product refs to read first (required by Firestore tx semantics)
      const productRefs = items
        .map((it) => String(it?.id || "").trim())
        .filter(Boolean)
        .map((pid) => db.collection("products").doc(pid));

      // Read all product docs
      const productSnaps = await Promise.all(productRefs.map((r) => tx.get(r)));

      // Map id -> snapshot
      const pMap = new Map();
      productRefs.forEach((ref, i) => pMap.set(ref.id, productSnaps[i]));

      let touched = 0;

      // For each item, compute next stock and stage updates
      for (const it of items) {
        const pid = String(it?.id || "").trim();
        if (!pid) continue;

        const pSnap = pMap.get(pid);
        if (!pSnap?.exists) continue;

        const pData = pSnap.data() || {};

        // Optional kill-switch: skip if product has trackInventory === false
        if (pData.trackInventory === false) continue;

        const curr = Number(pData.stock);
        const qty = Number(it?.qty || 0);

        // Only operate on numeric stocks and positive qty
        if (!Number.isFinite(curr) || !Number.isFinite(qty) || qty <= 0) continue;

        const next = Math.max(0, curr - qty); // never below 0

        // Update product stock
        tx.update(pSnap.ref, {
          stock: next,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Append stock trail entry (1 doc per item)
        const trailRef = db.collection("stockTrail").doc();
        tx.set(trailRef, {
          productId: pid,
          delta: -qty,
          reason: "sale",
          note: `Order ${orderId} via ${order?.source || "unknown"}`,
          refNo: orderId,
          price: Number(it?.price ?? 0) || null,
          afterStock: next,
          at: FieldValue.serverTimestamp(),
          actor: "cloud-function",
          snap: {
            title: it?.title ?? null,
            sku: it?.sku ?? null,
            sizeLabel: it?.sizeLabel ?? null,
          },
        });

        touched++;
      }

      // Mark order as adjusted to make the whole thing idempotent
      tx.update(orderRef, {
        inventoryAdjusted: true,
        inventoryAdjustedAt: FieldValue.serverTimestamp(),
      });

      console.log("[deduct] adjusted", { orderId, items: items.length, touched });
    });
  }
);











//ACCOUNTING ---> PURCHASING
//------------------------------------------------------------------------------------------




// --- IMPORTS you already have above ---
// import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
// import { onSchedule } from "firebase-functions/v2/scheduler";
// import { initializeApp } from "firebase-admin/app";
// import { getFirestore, FieldValue } from "firebase-admin/firestore";


// Helper to sum already-applied credits for a bill
async function getAlreadyAppliedForBill(tx, billRef) {
  const appsSnap = await tx.get(billRef.collection("creditApplications"));
  let sum = 0;
  const seen = new Set(); // creditIds used on this bill
  appsSnap.forEach(d => {
    const a = d.data() || {};
    sum += Number(a.amount || 0);
    if (a.creditId) seen.add(String(a.creditId));
  });
  return { sumApplied: sum, seenCreditIds: seen };
}

/**
 * Auto-apply vendor credits:
 * - Runs on CREATE and UPDATE of a bill
 * - Only if bill.status !== "CANCELLED" and bill.balance > 0
 * - Applies oldest credits first (FIFO)
 * - Idempotent: re-checks already-applied rows on every run
 */
export const autoApplyVendorCreditsOnBillWrite = onDocumentWritten(
  { document: "bills/{billId}", region: "us-central1" },
  async (event) => {
    if (!event.data?.after?.exists) return;
    const before = event.data.before?.data() || null;
    const after = event.data.after.data() || {};
    const billRef = event.data.after.ref;
    const billId = event.params.billId;

    // Skip cancelled bills or missing vendor
    if (!after.vendorId || (after.status || "OPEN") === "CANCELLED") return;

    // If balance is already zero or negative, nothing to do
    const startingBalance = Number(after.balance ?? after.total ?? 0);
    if (!Number.isFinite(startingBalance) || startingBalance <= 0) return;

    // Optional kill-switch on bill: set autoApplyCredits: false to skip
    if (after.autoApplyCredits === false) return;

    await db.runTransaction(async (tx) => {
      // Re-read bill inside tx (consistency)
      const fresh = await tx.get(billRef);
      if (!fresh.exists) return;
      const bill = fresh.data() || {};
      if ((bill.status || "OPEN") === "CANCELLED") return;

      const billTotal = Number(bill.total || 0);
      const billBalance = Number(bill.balance ?? billTotal);
      if (!Number.isFinite(billBalance) || billBalance <= 0) return;

      // Sum credits already applied (subcollection)
      const { sumApplied } = await getAlreadyAppliedForBill(tx, billRef);

      // We’ll re-compute how much is still needed right now
      let remaining = Math.max(0, billTotal - sumApplied - 0 /* payments accounted elsewhere? */);

      // Clamp to current bill.balance to be safe
      remaining = Math.min(remaining, billBalance);
      if (remaining <= 0) return;

      // Read open credits for this vendor (ALL READS before writes)
      const creditsQ = await tx.get(
        db.collection("vendorCredits")
          .where("vendorId", "==", String(bill.vendorId))
          .where("balance", ">", 0)
          .orderBy("balance", "asc")
      );

      const creditRefs = creditsQ.docs.map(d => d.ref);
      const creditSnaps = await Promise.all(creditRefs.map(r => tx.get(r)));

      // Now WRITES
      for (let i = 0; i < creditSnaps.length && remaining > 0; i++) {
        const cSnap = creditSnaps[i];
        if (!cSnap.exists) continue;
        const c = cSnap.data() || {};
        const currBal = Number(c.balance || 0);
        if (!Number.isFinite(currBal) || currBal <= 0) continue;

        const apply = Math.min(remaining, currBal);
        if (apply <= 0) continue;

        // Update credit balance
        tx.update(cSnap.ref, {
          balance: currBal - apply,
          status: (currBal - apply) <= 0 ? "CLOSED" : (c.status || "OPEN"),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // Add application row under bill (auto-id)
        const appRef = billRef.collection("creditApplications").doc();
        tx.set(appRef, {
          creditId: cSnap.id,
          amount: apply,
          at: FieldValue.serverTimestamp(),
          actor: "cloud-function",
        });

        remaining -= apply;
      }

      // Finally update bill balance (never below 0)
      const nextBalance = Math.max(0, billBalance - (billBalance - remaining));
      // Note: (billBalance - remainingApplied) == amountApplied, while `remaining` is now actual left.
      // Simpler: nextBalance is just `remaining`
      tx.update(billRef, {
        balance: remaining,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    console.log("[credits] auto-applied to bill", { billId });
  }
);


//Auto-scheduler for Recurring Expenses



// Utility: add period to a JS Date
function addPeriod(date, frequency, every = 1) {
  const d = new Date(date);
  const step = Math.max(1, Number(every || 1));
  switch (frequency) {
    case "DAILY": d.setDate(d.getDate() + step); break;
    case "WEEKLY": d.setDate(d.getDate() + 7 * step); break;
    case "MONTHLY": d.setMonth(d.getMonth() + step); break;
    case "YEARLY": d.setFullYear(d.getFullYear() + step); break;
    default: d.setMonth(d.getMonth() + step); break;
  }
  return d;
}

function ymd(d) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Scheduler that emits expenses for due recurring profiles.
 * Runs hourly (cheap) and catches anything with nextOn <= now.
 * Idempotent: uses deterministic expense docId `${recId}_${periodKey}`.
 */
export const emitRecurringExpenses = onSchedule(
  { schedule: "every 60 minutes", timeZone: "Asia/Kolkata", region: "us-central1" },
  async () => {
    const now = new Date();
    const recurQ = await db.collection("recurringExpenses")
      .where("active", "==", true)
      .where("nextOn", "<=", new Date(now)) // server side will coerce to Timestamp
      .get();

    if (recurQ.empty) return;

    await Promise.all(recurQ.docs.map(async (recDoc) => {
      const rec = recDoc.data() || {};
      const recId = recDoc.id;

      // Determine this emission's key based on nextOn (not "now")
      const dueDate = rec.nextOn?.toDate ? rec.nextOn.toDate() : new Date();
      const periodKey = ymd(dueDate);
      const expenseId = `${recId}_${periodKey}`; // deterministic for idempotency

      const expenseRef = db.collection("expenses").doc(expenseId);

      await db.runTransaction(async (tx) => {
        // READS
        const [expSnap, freshRec] = await Promise.all([
          tx.get(expenseRef),
          tx.get(recDoc.ref),
        ]);

        // If this emission already exists, just roll nextOn forward once (in case it didn’t update)
        if (expSnap.exists) {
          const nxt = addPeriod(dueDate, rec.frequency, rec.every);
          tx.update(recDoc.ref, {
            nextOn: nxt,
            lastEmittedOn: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          return;
        }

        // WRITE: create the expense
        tx.set(expenseRef, {
          vendorId: rec.vendorId || null,
          title: rec.title || "Recurring Expense",
          amount: Number(rec.amount || 0),
          categoryId: rec.categoryId || null,
          accountId: rec.accountId || null,
          source: "recurring",
          recurringId: recId,
          periodKey,
          createdAt: FieldValue.serverTimestamp(),
          status: "POSTED",
        });

        // WRITE: roll the schedule
        const nextDate = addPeriod(dueDate, rec.frequency, rec.every);
        tx.update(recDoc.ref, {
          nextOn: nextDate,
          lastEmittedOn: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    }));

    console.log("[recurring] emitted expenses for due profiles", { count: recurQ.size });
  }
);


