import { Document } from 'mongoose';

export enum ProductStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    DISABLED = 'disabled',
}

export enum ProductCampaignRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export interface IProductSize {
    _id?: string;
    size: string;
    price: number;
    quantity: number;
    stock_status: StockStatus;
    discount: {
        price: number;
        start_date: Date;
        end_date: Date;
    };
    discount_percentage: number;
    variation_id: string;
}

export interface IPromoProduct {
    promo_price: number;
    promo_stock: number;
    variation_id: string;
    stock_status: string;
    
}

export enum StockStatus {
    IN_STOCK = 'in-stock',
    OUT_OF_STOCK = 'out-of-stock', // quantity is 0
    LOW_ON_STOCK = 'low-on-stock', // quantity is between 1 and 3 (inclusive)
}

export interface PromoSizeVariation {
    variation_id: string;
    promo_price: number;
    promo_stock: string;
}

export interface IProduct {
    name: string;
    brand: string;
    category?: string;
    color: string;
    long_description: string;
    short_description: string;
    weight: number;
    warranty: string;
    specification: string[];
    price?: number;
    discount?: {
        price: number;
        start_date: Date;
        end_date: Date;
    };
    discount_percentage?: number;
    size_variations?: IProductSize[];
    quantity?: number;
    primary_image: string;
    sku: string;
    images: string[];
    status?: ProductStatus;
    enabled: boolean;
    is_top_deal: boolean;
    is_bundle: boolean;
    is_deleted: boolean;
    campaign?: {
        id: string;
        name?: string;
        status?: string;
        comment?: string;
        promo_price?: number;
        promo_stock?: string;
        size_variations_promo_price?: PromoSizeVariation[];
        date_posted: Date;
    };
    stock_status?: StockStatus;
    rating?: {
        times?: number;
        total?: number;
        average?: number;
    };
    slug?: string;
}

export interface IProductModel extends Document, IProduct {}
