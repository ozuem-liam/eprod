import { Document } from 'mongoose';

export enum AdminRole {
    SUPER_ADMIN = 'super_admin',
    AUDITOR = 'auditor',
    PLATFORM_MANAGER = 'platform_manager',
    CUSTOMER_CARE = 'customer_care',
    IT_CONTROL = 'it_control',
    MARKETING = 'marketing',
    OPERATIONS = 'operations',
    VENDOR_MANAGEMENT = 'vendor_management',
}

export interface IAdmin {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    staff_id: string;
    role: AdminRole;
    has_access?: boolean;
}
export interface IAdminDocument extends IAdmin, Document {
    generateJWT(): string;
    name: string;
}
