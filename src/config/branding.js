/**
 * Centralized Branding and Nomenclature Configuration for white-labeling EcoTrace.
 * Modify these settings to rebrand the entire system.
 */
export const branding = {
  // Brand Text
  companyName: "EcoTrace Waste Management Solutions",
  shortName: "EcoTrace",
  tagline: "Track and Secure Biomedical Waste Management",
  
  // Nomenclature Settings (customize terminology across the UI)
  nomenclature: {
    hcf: "Healthcare Facility",
    hcfShort: "HCF",
    hcfPlural: "Healthcare Facilities",
    district: "District",
    state: "State",
    plant: "Treatment Plant",
    operator: "Plant Operator",
  },
  
  // Theme styling (dynamic CSS variables can load from here if needed)
  theme: {
    primaryColor: "#10b981",    // EcoTrace green
    secondaryColor: "#06b6d4",  // Cyan
    accentDanger: "#ef4444",
    accentWarning: "#f59e0b",
    accentSuccess: "#10b981",
  },
  
  // Business and regulatory configurations
  regulatory: {
    stateCode: "JH", // Default state
    stateName: "Jharkhand",
    authorityName: "Jharkhand State Pollution Control Board (JSPCB)",
    ruleText: "Bio-Medical Waste Management Rules, 2016",
  },
  
  // Contact details shown in reports and certificates
  contact: {
    address: "Plot No. 42, Industrial Area, Sector 5, Dhanbad, Jharkhand - 826001",
    email: "support@ecotrace.in",
    phone: "+91 626 555 0199",
    website: "https://www.ecotrace.in",
  },

  // Operational toggles
  demoMode: true, // Set to false to disable auto-signup on login failure
};
