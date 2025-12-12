// lib/permissions.ts

export type Role = 'USER' | 'MANAGER' | 'SENIOR_MANAGER' | 'ADMIN' | 'DIRECTOR';
export type SecurityLevel = 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';

const roleHierarchy: { [key in Role]: number } = {
  'USER': 1,
  'MANAGER': 2,
  'SENIOR_MANAGER': 3,
  'DIRECTOR': 4, // As per matrix, Admin and Director are equivalent for Top Secret
  'ADMIN': 4,
};

const requiredViewLevel: { [key in SecurityLevel]: number } = {
  'UNCLASSIFIED': roleHierarchy.USER,
  'CONFIDENTIAL': roleHierarchy.MANAGER,
  'SECRET': roleHierarchy.SENIOR_MANAGER,
  'TOP_SECRET': roleHierarchy.ADMIN,
};

const requiredApproveLevel: { [key in SecurityLevel]: number } = {
    'UNCLASSIFIED': roleHierarchy.USER, // No approval needed, effectively open
    'CONFIDENTIAL': roleHierarchy.MANAGER,
    'SECRET': roleHierarchy.SENIOR_MANAGER,
    'TOP_SECRET': roleHierarchy.ADMIN,
};


/**
 * Checks if a user's role grants them permission to view a document of a certain security level.
 * @param documentLevel The security level of the document.
 * @param userRole The role of the user.
 * @returns boolean - True if the user can view, false otherwise.
 */
export const canView = (documentLevel: SecurityLevel, userRole: Role): boolean => {
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = requiredViewLevel[documentLevel];

  if (!requiredLevel) {
    return false; // Or handle as a default case, e.g., true for unclassified.
  }
  
  return userLevel >= requiredLevel;
};

/**
 * Checks if a user's role grants them permission to approve a document of a certain security level.
 * @param documentLevel The security level of the document.
 * @param userRole The role of the user.
 * @returns boolean - True if the user can approve, false otherwise.
 */
export const canApprove = (documentLevel: SecurityLevel, userRole: Role): boolean => {
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = requiredApproveLevel[documentLevel];

    if(documentLevel === 'UNCLASSIFIED') {
        return false; // No approval action is required for unclassified documents.
    }
  
    if (!requiredLevel) {
      return false;
    }
    
    return userLevel >= requiredLevel;
};