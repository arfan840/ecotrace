/**
 * Fine-grained Role-Based Authorization and Permissions Manager
 */

export const RolePermissions = {
  // Plant Head / Super Admin: Full administrative access
  plant_head: {
    users: ['view', 'create', 'edit', 'delete', 'manage'],
    hospitals: ['view', 'create', 'edit', 'delete', 'manage'],
    vehicles: ['view', 'create', 'edit', 'delete', 'manage'],
    routes: ['view', 'create', 'edit', 'delete', 'manage'],
    bags: ['view', 'create', 'edit', 'delete', 'manage'],
    batches: ['view', 'create', 'edit', 'delete', 'manage', 'approve'],
    discrepancies: ['view', 'create', 'edit', 'delete', 'resolve'],
    reports: ['view', 'export'],
    certificates: ['view', 'create', 'print'],
    audit_logs: ['view'],
  },
  
  // Plant Manager / Operations Manager: Full operations management, no user deletion or hospital deletion
  plant_manager: {
    users: ['view'],
    hospitals: ['view', 'create', 'edit'],
    vehicles: ['view', 'create', 'edit'],
    routes: ['view', 'create', 'edit'],
    bags: ['view', 'create', 'edit'],
    batches: ['view', 'create', 'edit', 'approve'],
    discrepancies: ['view', 'create', 'edit', 'resolve'],
    reports: ['view', 'export'],
    certificates: ['view', 'create', 'print'],
    audit_logs: ['view'],
  },

  // Driver: Specialized transport operations
  driver: {
    users: [],
    hospitals: ['view'],
    vehicles: ['view'],
    routes: ['view', 'create', 'edit'], // active route logging
    bags: ['view', 'edit'], // updating status to 'collected'
    batches: [],
    discrepancies: ['create'],
    reports: [],
    certificates: [],
    audit_logs: [],
  },

  // HCF: Healthcare Facility self-dispatch portal
  hcf: {
    users: [],
    hospitals: ['view'], // view own hospital
    vehicles: [],
    routes: [],
    bags: ['view', 'create'], // generate own bags
    batches: [],
    discrepancies: ['view'], // view own discrepancies
    reports: ['view'],
    certificates: ['view', 'print'], // view/print own certificates
    audit_logs: [],
  },

  // Regulatory / Auditor: Read-only access to everything for compliance audit
  regulatory: {
    users: ['view'],
    hospitals: ['view'],
    vehicles: ['view'],
    routes: ['view'],
    bags: ['view'],
    batches: ['view'],
    discrepancies: ['view'],
    reports: ['view', 'export'],
    certificates: ['view'],
    audit_logs: ['view'],
  }
};

/**
 * Checks if a user role can perform a specific action on a resource.
 * @param {string} role - The user's role (e.g. 'plant_head', 'driver')
 * @param {string} resource - The resource being accessed (e.g. 'users', 'bags')
 * @param {string} action - The action attempted (e.g. 'create', 'delete')
 * @returns {boolean} Whether action is allowed
 */
export function canPerform(role, resource, action) {
  if (!role || !resource || !action) return false;
  const roleRules = RolePermissions[role];
  if (!roleRules) return false;
  
  const allowedActions = roleRules[resource];
  if (!allowedActions) return false;
  
  return allowedActions.includes(action) || allowedActions.includes('manage');
}
