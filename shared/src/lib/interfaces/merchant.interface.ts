export interface CreateMerchantRequest {
    name: string;
    phone: string;
    verificationToken: string;
    address: string;
    city: string;
    contactName: string;
    businessType: string;
    businessCategory: string;
    referralSource: string;
    hasBusinessLicense: boolean;
    socialLinks?: any;
}

export interface MerchantResponse {
    id: number;
    externalId: string;
    name: string;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    contactName?: string | null;
    businessType?: string | null;
    businessCategory?: string | null;
    referralSource?: string | null;
    hasBusinessLicense?: boolean | null;
    metadata?: any;
    status?: string | null;
    ownerId?: number | null;
    brandId?: number | null;
    agencyId?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    createdAt: string | Date;
    updatedAt?: string | Date | null;
}
