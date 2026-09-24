/**
 * Centralized Navigation Configuration for Construction OS
 * 
 * Defines all 15 navigation routes across 3 domains:
 * 1. CRM Domain (5 routes): Leads, Customers, Invoices, Payments, Communications
 * 2. Construction Operations Domain (6 routes): Projects, Estimates, Scheduling, Work Orders, Materials, Subcontractors
 * 3. AI Agent Control Center (4 routes): Sales Triage & Auto-Send, Estimating Calculator, Marketing SEO Blog Manager, Web Scraper
 */

export interface NavItem {
  id: string;
  name: string;
  href: string;
  badge?: string;
  description: string;
  iconName?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const NAVIGATION_CONFIG: NavGroup[] = [
  {
    id: "crm",
    title: "CRM",
    items: [
      {
        id: "leads",
        name: "Leads",
        href: "/crm/leads",
        description: "Inbound leads & AI qualification",
        iconName: "Users",
        badge: "AI Scored",
      },
      {
        id: "customers",
        name: "Customers",
        href: "/crm/customers",
        description: "Customer accounts & contact directory",
        iconName: "Building2",
      },
      {
        id: "invoices",
        name: "Invoices",
        href: "/crm/invoices",
        description: "Billing, invoices & payment status",
        iconName: "FileText",
      },
      {
        id: "payments",
        name: "Payments",
        href: "/crm/payments",
        description: "Payment ledger & transaction records",
        iconName: "CreditCard",
      },
      {
        id: "communications",
        name: "Communications",
        href: "/crm/communications",
        description: "Email & SMS logs with sentiment",
        iconName: "MessageSquare",
        badge: "Zero-API",
      },
    ],
  },
  {
    id: "construction",
    title: "Construction",
    items: [
      {
        id: "projects",
        name: "Projects",
        href: "/construction/projects",
        description: "Active projects, job costing & timelines",
        iconName: "HardHat",
      },
      {
        id: "estimates",
        name: "Takeoffs & Estimates",
        href: "/construction/estimates",
        description: "Quantity takeoffs & trade bids",
        iconName: "Calculator",
      },
      {
        id: "scheduling",
        name: "Scheduling",
        href: "/construction/scheduling",
        description: "Gantt timeline & work order schedule",
        iconName: "Calendar",
      },
      {
        id: "work-orders",
        name: "Work Orders",
        href: "/construction/work-orders",
        description: "Field technician tasks & checklists",
        iconName: "ClipboardList",
      },
      {
        id: "materials",
        name: "Materials",
        href: "/construction/materials",
        description: "Inventory catalog & stock thresholds",
        iconName: "Package",
      },
      {
        id: "subcontractors",
        name: "Subcontractors",
        href: "/construction/subcontractors",
        description: "Trade partners, licenses & ratings",
        iconName: "Briefcase",
      },
    ],
  },
  {
    id: "agents",
    title: "AI Agent Control Center",
    items: [
      {
        id: "sales",
        name: "Sales Triage & Auto-Send",
        href: "/agents/sales",
        description: "Spam triage & autonomous outbound emails",
        iconName: "Bot",
        badge: "Autonomous",
      },
      {
        id: "estimating",
        name: "Estimating Calculator",
        href: "/agents/estimating",
        description: "Job spec parser & dimension takeoff",
        iconName: "Cpu",
        badge: "Trade Math",
      },
      {
        id: "marketing",
        name: "Marketing SEO Blog Manager",
        href: "/agents/marketing",
        description: "Multi-brand blog generator & disk publisher",
        iconName: "Share2",
        badge: "Multi-Site",
      },
      {
        id: "scraper",
        name: "Web Scraper",
        href: "/agents/scraper",
        description: "Autonomous trade lead directory crawler",
        iconName: "Globe",
        badge: "Crawler",
      },
    ],
  },
];

/**
 * Returns a flat array of all 15 navigation items
 */
export function getAllNavItems(): NavItem[] {
  return NAVIGATION_CONFIG.flatMap((group) => group.items);
}

/**
 * Finds a specific navigation item by route href
 */
export function findNavItemByHref(href: string): NavItem | undefined {
  return getAllNavItems().find((item) => item.href === href);
}

/**
 * Retrieves a navigation group by its identifier (e.g. 'crm', 'construction', 'agents')
 */
export function getNavGroupById(groupId: string): NavGroup | undefined {
  return NAVIGATION_CONFIG.find((group) => group.id === groupId);
}
