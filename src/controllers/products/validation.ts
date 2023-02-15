import BaseJoi, { ObjectSchema, ValidationResult } from 'joi';
import JoiDate from '@joi/date';
import { IProduct, ProductStatus, StockStatus } from '../../types/product';

const Joi = BaseJoi.extend(JoiDate);

export const createProductSchema: ObjectSchema = Joi.object({
    name: BaseJoi.string().required(),
    brand: BaseJoi.string().required(),
    category: BaseJoi.string().optional(),
    color: BaseJoi.string().optional(),
    long_description: BaseJoi.string().max(3000).required(),
    short_description: BaseJoi.string().max(800).required(),
    weight: BaseJoi.number().required(),
    warranty: BaseJoi.string().optional(),
    specification: BaseJoi.alternatives().try(
        BaseJoi.array().items(BaseJoi.string().optional()),
        BaseJoi.string().optional(),
    ),
    price: BaseJoi.number().optional(),
    discount: BaseJoi.alternatives()
        .try(
            BaseJoi.object({
                price: BaseJoi.number().required(),
                start_date: Joi.date().format('YYYY-MM-DD').optional(),
                end_date: Joi.date().format('YYYY-MM-DD').optional(),
            }).optional(),
            BaseJoi.string().optional(),
        )
        .when('price', {
            is: BaseJoi.exist(),
            then: BaseJoi.optional(),
            otherwise: BaseJoi.forbidden(),
        })
        .messages({
            'any.unknown': 'discount is allowed only when there is a price set',
        }),
    discount_percentage: BaseJoi.number().optional(),
    size_variations: BaseJoi.alternatives()
        .try(
            BaseJoi.array()
                .items(
                    BaseJoi.object({
                        size: BaseJoi.string().required(),
                        price: BaseJoi.number().required(),
                        quantity: BaseJoi.number().min(1).required(),
                        discount: BaseJoi.object({
                            price: BaseJoi.number().required(),
                            start_date: Joi.date().format('YYYY-MM-DD').optional(),
                            end_date: Joi.date().format('YYYY-MM-DD').optional(),
                        }).optional(),
                    }),
                )
                .optional(),
            BaseJoi.string().optional(),
        )
        .when('price', {
            is: BaseJoi.exist(),
            then: BaseJoi.forbidden(),
            otherwise: BaseJoi.required(),
        })
        .messages({
            'any.unknown': 'Size variations is allowed only when the product price field is not set',
        }),
    quantity: BaseJoi.number()
        .min(1)
        .when('price', {
            is: BaseJoi.exist(),
            then: BaseJoi.required(),
            otherwise: BaseJoi.forbidden(),
        })
        .messages({
            'any.unknown': 'Quantity is only allowed when the product has no variation and a price field is set',
        }),
    sku: BaseJoi.string().optional(),
    status: BaseJoi.string()
        .valid(...Object.values(ProductStatus))
        .optional(),
    enabled: BaseJoi.boolean().optional(),
    is_top_deal: BaseJoi.boolean().optional(),
    is_bundle: BaseJoi.boolean().optional(),
    is_deleted: BaseJoi.boolean().optional(),
    stock_status: BaseJoi.string()
        .valid(...Object.values(StockStatus))
        .optional(),
    image1: BaseJoi.string().optional(),
    image2: BaseJoi.string().optional(),
    image3: BaseJoi.string().optional(),
    image4: BaseJoi.string().optional(),
    image5: BaseJoi.string().optional(),
}).or('category');

export const validateUpdateProduct = (products: IProduct[]): ValidationResult => {
    const schema: ObjectSchema = Joi.object({
        name: BaseJoi.string().optional(),
        brand: BaseJoi.string().optional(),
        category: BaseJoi.string().optional(),
        color: BaseJoi.string().optional(),
        long_description: BaseJoi.string().max(3000).optional(),
        short_description: BaseJoi.string().max(800).optional(),
        weight: BaseJoi.number().optional(),
        dimensions: BaseJoi.string().optional(),
        warranty: BaseJoi.string().optional(),
        specification: BaseJoi.alternatives().try(
            BaseJoi.array().items(BaseJoi.string().optional()),
            BaseJoi.string().optional(),
        ),
        price: BaseJoi.number().optional(),
        discount: BaseJoi.alternatives().try(
            BaseJoi.object({
                price: BaseJoi.number().optional(),
                start_date: Joi.date().format('YYYY-MM-DD').optional(),
                end_date: Joi.date().format('YYYY-MM-DD').optional(),
            }).optional(),
            BaseJoi.string().optional(),
        ),
        size_variations: BaseJoi.alternatives().try(
            BaseJoi.array()
                .items(
                    BaseJoi.object({
                        size: BaseJoi.string().required(),
                        price: BaseJoi.number().required(),
                        quantity: BaseJoi.number().min(1).required(),
                        discount: BaseJoi.object({
                            price: BaseJoi.number().required(),
                            start_date: Joi.date().format('YYYY-MM-DD').optional(),
                            end_date: Joi.date().format('YYYY-MM-DD').optional(),
                        }).optional(),
                    }),
                )
                .optional(),
            BaseJoi.string().optional(),
        ),
        quantity: BaseJoi.number().min(1).optional(),
        sku: BaseJoi.string().optional(),
        images: BaseJoi.array()
            .items(
                BaseJoi.string()
                    .uri({ scheme: ['https'] })
                    .optional(),
            )
            .optional(),
        status: BaseJoi.string()
            .valid(...Object.values(ProductStatus))
            .optional(),
        enabled: BaseJoi.boolean().optional(),
        is_top_deal: BaseJoi.boolean().optional(),
        is_bundle: BaseJoi.boolean().optional(),
        is_deleted: BaseJoi.boolean().optional(),
        image1: BaseJoi.string().optional(),
        image2: BaseJoi.string().optional(),
        image3: BaseJoi.string().optional(),
        image4: BaseJoi.string().optional(),
        image5: BaseJoi.string().optional(),
    });

    return schema.validate(products);
};

export const validateProductDiscount = async (body: any): Promise<ValidationResult> => {
    const schema: ObjectSchema = Joi.object({
        price: Joi.number().required().messages({
            'number.base': 'Discount price must be a number',
            'any.required': 'Discount price is required',
        }),
        start_date: Joi.date().optional(),
        end_date: Joi.date()
            .optional()
            .when('start_date', {
                is: Joi.exist(),
                then: Joi.required(),
                otherwise: Joi.forbidden(),
            })
            .messages({
                'any.required': 'Discount end date is required if discount start date is provided',
            }),
    }).required();
    return schema.validate(body);
};

export const validateProductSku = async (body: any): Promise<ValidationResult> => {
    const schema: ObjectSchema = Joi.object({
        sku: Joi.string().required(),
    }).required();
    return schema.validate(body);
};
