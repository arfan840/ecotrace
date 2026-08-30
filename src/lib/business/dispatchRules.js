/**
 * Business rules for waste bag collection and dispatch
 */

/**
 * Checks if a facility is restricted from driver-side collection scanning.
 * Facilities with more than 30 beds must perform scan and dispatch by their own staff.
 * @param {object} hospital - Hospital data containing beds count
 * @returns {boolean} - True if scanning/dispatch must be performed by HCF staff only
 */
export function isStaffOnlyScanRequired(hospital) {
  if (!hospital) return false;
  return (Number(hospital.beds) || 0) > 30;
}
