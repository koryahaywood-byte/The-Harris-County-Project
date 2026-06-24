import raw from "../data/officials-contacts.json";

export interface OfficialContact {
  slug?: string;
  name: string;
  office: string;
  jurisdiction: "city" | "county" | "state" | "school" | "federal";
  roleCategory: "executive" | "legislative" | "judicial" | "law-enforcement" | "school-board" | "clerk";
  district: string;
  phone?: string;
  districtPhone?: string;
  email?: string;
  website?: string;
  contactForm?: string;
  address?: string;
  dataSource: string;
  lastVerified: string; // "YYYY-MM-DD" or "pending-scrape"
}

const contactsData = raw.officials;

const bySlug = new Map<string, OfficialContact>();
const byDistrict = new Map<string, OfficialContact[]>();

for (const c of contactsData as unknown as OfficialContact[]) {
  if (c.slug) bySlug.set(c.slug, c);
  if (c.district) {
    const list = byDistrict.get(c.district) ?? [];
    list.push(c);
    byDistrict.set(c.district, list);
  }
}

export function getContactBySlug(slug: string): OfficialContact | undefined {
  return bySlug.get(slug);
}

export function getContactsByDistrict(district: string): OfficialContact[] {
  return byDistrict.get(district) ?? [];
}

export function getContactsByJurisdiction(jurisdiction: OfficialContact["jurisdiction"]): OfficialContact[] {
  return (contactsData as unknown as OfficialContact[]).filter(c => c.jurisdiction === jurisdiction);
}

export function getContactsByRole(roleCategory: OfficialContact["roleCategory"]): OfficialContact[] {
  return (contactsData as unknown as OfficialContact[]).filter(c => c.roleCategory === roleCategory);
}

export function isVerified(contact: OfficialContact): boolean {
  return contact.lastVerified !== "pending-scrape" && contact.lastVerified !== "";
}

export function pendingContactCount(): number {
  return (contactsData as unknown as OfficialContact[]).filter(c => !isVerified(c)).length;
}

export const ALL_CONTACTS: OfficialContact[] = contactsData as unknown as OfficialContact[];
