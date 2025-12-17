export interface CreateAgencyRequest {
    name: string;
    phone: string;
    verificationToken: string;
    taxCode?: string;
    bankAccount?: string;
    address?: string;
    email?: string;
    logo?: string;
    businessLicenseUrl?: string;
}

export interface AgencyResponse {
    id: number;
    externalId: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    taxCode?: string | null;
    bankAccount?: string | null;
    address?: string | null;
    logo?: string | null;
    businessLicenseUrl?: string | null;
    status: string;
    ownerId?: number | null;
    createdAt: string | Date;
    updatedAt?: string | Date | null;
}
