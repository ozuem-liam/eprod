import { model, Schema } from 'mongoose';
import slugify from 'slugify';
import { IProductModel, ProductCampaignRequestStatus, ProductStatus, StockStatus } from '../types/product';
import Logger from '../config/log';
import { ALPHANUMERIC_POOL, generateString } from '../services/generateString';

const POOL_SIZE = 8;

const productSchema = new Schema(
    {
        sku: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        brand: { type: String, required: true },
        category: { type: String, required: true },
        color: { type: String },
        long_description: { type: String, required: false },
        short_description: { type: String, required: false },
        weight: { type: Number, required: true },
        warranty: { type: String, required: false },
        specification: { type: [String], default: undefined },
        price: { type: Number, required: false },
        slug: { type: String, required: false },
        discount: {
            price: { type: Number },
            start_date: { type: Date, required: false },
            end_date: { type: Date, required: false },
        },
        discount_percentage: { type: Number },
        size_variations: {
            type: [
                {
                    size: { type: String },
                    price: { type: Number },
                    stock_status: {
                        type: String,
                        enum: Object.values(StockStatus),
                        required: true,
                        default: StockStatus.IN_STOCK,
                    },
                    quantity: { type: Number, min: 0 },
                    discount: {
                        price: { type: Number },
                        start_date: { type: Date },
                        end_date: { type: Date },
                    },
                    discount_percentage: { type: Number },
                    variation_id: { type: String },
                },
            ],
        },
        quantity: { type: Number, min: 0, required: false },
        images: { type: [String], required: true },
        primary_image: { type: String },
        status: {
            type: String,
            enum: Object.values(ProductStatus),
            required: true,
            default: ProductStatus.PENDING,
        },
        stock_status: {
            type: String,
            enum: Object.values(StockStatus),
        },
        campaign: {
            id: {
                type: Schema.Types.ObjectId,
                ref: 'Campaign',
            },
            name: {
                type: String,
                required: false,
            },
            status: {
                type: String,
                enum: Object.values(ProductCampaignRequestStatus),
            },
            promo_price: {
                type: Number,
            },
            size_variations_promo_price: {
                type: [
                    {
                        promo_price: Number,
                        promo_stock: Number,
                        stock_status: String,
                        variation_id: String,
                    },
                ],
                default: undefined,
            },
            promo_stock: {
                type: Number,
            },
            comment: {
                type: String,
                required: false,
            },
            createdDate: {
                type: String,
            },
        },
        enabled: { type: Boolean, default: false },
        is_top_deal: { type: Boolean, default: false },
        is_bundle: { type: Boolean, default: false },
        is_deleted: { type: Boolean, default: false },
        rating: {
            times: {
                type: Number,
                required: true,
                default: 0,
            },
            total: {
                type: Number,
                required: true,
                default: 0,
            },
            average: {
                type: Number,
                required: true,
                default: 0,
            },
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
    },
);

productSchema.pre('save', function (this: IProductModel, next: () => void) {
    this.slug = `${slugify(this.name, {
        lower: true,
        remove: /[*`~!@#$%^&()_+:;"'|<>]/g,
        replacement: '-',
    })}-${generateString(ALPHANUMERIC_POOL, POOL_SIZE)}`;
    next();
});

productSchema.index({
    name: 'text',
    slug: 'text',
    store_name: 'text',
});

const Product = model<IProductModel>('Product', productSchema);

// Automatically called function to delete indexes on product schema and add the new ones on server restart
(async () => {
    try {
        Logger.info({}, '[Product][Index] Delete all unused indexes');
        await Product.syncIndexes();

        Logger.info({}, '[Product][Index] Add Product Text Indexes');
        await Product.createIndexes();
    } catch (err) {
        Logger.error(err);
    }
})();

export { Product };
