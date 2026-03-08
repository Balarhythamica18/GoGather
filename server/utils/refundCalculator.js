import { calculateHoursRemaining } from "./dateUtils.js";

/**
 * Calculate refund percentage and amount based on policies and tiers
 * @param {Object} booking - The booking object
 * @param {Object} event - The event object
 * @returns {Object} - { percentage, amount, policyName }
 */
export const calculateRefund = (booking, event) => {
  if (!booking || booking.amount === 0) {
    return { percentage: 0, amount: 0, policyName: "Free Booking/No Payment" };
  }

  const hoursRemaining = calculateHoursRemaining(event);
  let refundPercentage = 0;
  let policyName = "Non-refundable (Less than 24 hours before event)";
  let hasAppliedPolicy = false;

  // 1. Check Event-Specific Policies
  if (event && event.refundPolicy) {
    const policy = event.refundPolicy.toLowerCase().trim();
    if (policy.includes("no refund") || policy.includes("non-refundable")) {
      refundPercentage = 0;
      policyName = "No refund (Event policy)";
      hasAppliedPolicy = true;
    } else if (policy.includes("full refund") || policy.includes("100%")) {
      refundPercentage = 100;
      policyName = "100% Refund (Event policy)";
      hasAppliedPolicy = true;
    } else if (policy.includes("partial refund") || policy.includes("50%")) {
      refundPercentage = 50;
      policyName = "50% Refund (Event policy)";
      hasAppliedPolicy = true;
    }
  }

  // 2. Check Structured Refund Tiers
  if (!hasAppliedPolicy && event && event.refundTiers && event.refundTiers.length > 0) {
    // Sort tiers by hoursBefore descending to find the highest applicable tier
    const sortedTiers = [...event.refundTiers].sort((a, b) => b.hoursBefore - a.hoursBefore);
    
    for (const tier of sortedTiers) {
      if (hoursRemaining >= tier.hoursBefore) {
        refundPercentage = tier.refundPercentage;
        policyName = `${tier.refundPercentage}% Refund (Tier: ${tier.hoursBefore}h+ before event)`;
        hasAppliedPolicy = true;
        break;
      }
    }
    
    // If we have tiers but none applied (too late), it's 0
    if (!hasAppliedPolicy) {
      refundPercentage = 0;
      policyName = "No Refund (Last tier surpassed)";
      hasAppliedPolicy = true;
    }
  }

  // 3. Fallback to System Policies
  if (!hasAppliedPolicy) {
    const bookingTime = new Date(booking.createdAt);
    const now = new Date();
    const hoursSinceBooking = (now - bookingTime) / (1000 * 60 * 60);

    // Grace Period: Fully refundable within 2 hours of booking, if event is >24h away
    if (hoursSinceBooking <= 2 && hoursRemaining >= 24) {
      refundPercentage = 100;
      policyName = "100% Refund (Grace Period: within 2 hours of booking)";
    } else if (hoursRemaining >= 48) {
      refundPercentage = 90;
      policyName = "90% Refund (Greater than 48 hours notice)";
    } else if (hoursRemaining >= 24) {
      refundPercentage = 50;
      policyName = "50% Refund (24-48 hours notice)";
    }
  }

  const refundAmount = Math.round((booking.amount * refundPercentage) / 100 * 100) / 100;

  return {
    percentage: refundPercentage,
    amount: refundAmount,
    policyName
  };
};
