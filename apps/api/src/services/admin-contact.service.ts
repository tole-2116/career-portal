import { db } from "@career-portal/database";
import { BaseService } from "./base.service";
import type { AdminContactDto } from "../types/admin-contact.types";

const CONTACT_SELECT = {
  id: true,
  code: true,
  name: true,
  email: true,
  phone: true,
  subject: true,
  body: true,
  status: true,
  created_at: true,
} as const;

type ContactRow = {
  id: string;
  code: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  body: string;
  status: "NEW" | "READ" | "RESOLVED";
  created_at: Date;
};

function mapContact(contact: ContactRow): AdminContactDto {
  return {
    id: contact.id,
    code: contact.code ?? null,
    name: contact.name,
    email: contact.email,
    phone: contact.phone ?? null,
    subject: contact.subject,
    body: contact.body,
    status: contact.status,
    createdAt: contact.created_at.toISOString(),
  };
}

export class AdminContactService extends BaseService<AdminContactDto> {
  async updateStatus(id: string, status: AdminContactDto["status"]): Promise<AdminContactDto> {
    await this.assertContactExists(id);
    const row = await db.contact.update({
      where: { id },
      data: { status },
      select: CONTACT_SELECT,
    });
    return mapContact(row as unknown as ContactRow);
  }

  private async assertContactExists(id: string): Promise<void> {
    const row = await db.contact.findFirst({ where: { id, isdelete: false }, select: { id: true } });
    if (!row) throw new Error("CONTACT_NOT_FOUND");
  }

  constructor() {
    super();
    this.model = db.contact;
    this.orderByCol = "created_at";
    this.searchCols = ["name", "email", "subject"];
    this.rowSelect = CONTACT_SELECT;
    this.itemsKey = "contacts";
    this.notFoundMsg = "CONTACT_NOT_FOUND";
    this.mapRow = (row) => mapContact(row as unknown as ContactRow);
  }
}

export const adminContactService = new AdminContactService();
