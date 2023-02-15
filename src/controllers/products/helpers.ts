/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */
import httpStatus from 'http-status';
import { ObjectId, Types } from 'mongoose';
import { Request } from '../../types/app';
import ApiError from '../../utils/ApiError';
import { UploadedFile } from '@@/node_modules/@types/express-fileupload';
import { uploadImage, uploadImages } from '../../services/image-uploader';
import { getPercentageFromDiscountedPrice } from '../../utils/calculations';
import { IProductModel, IProductSize, StockStatus } from '../../types/product';
import { Product } from '../../models/product.model';
import { ALPHABET_POOL, ALPHANUMERIC_POOL, generateString } from '../../services/generateString';
import { MIN_PRICE_AMOUNT, PRODUCT_VARIATION_ID_SIZE, SKU_SIZE } from '../../utils/constant';
import { isNotEmpty } from '../../utils/helpers';
import validateSchema from '../../utils/validator';
import { createProductSchema, validateUpdateProduct, validateProductDiscount } from './validation';
import { object } from 'joi';

export const validateProductAssociation = async (req: Request): Promise<void> => {
    const price = req.body.price;
    let discount = req.body.discount;

    if (discount !== undefined) {
        const parsedDiscountObject = discount;
        // Cast price values to number to prevent implicit type conversion errors
        if (parsedDiscountObject.price == 0)
            throw new ApiError(httpStatus.BAD_REQUEST, 'Discount price cannot be equal to zero');

        if (parsedDiscountObject.price) {
            parsedDiscountObject.price = Number(parsedDiscountObject.price);

            const { error } = await validateProductDiscount(parsedDiscountObject);
            if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
            discount = parsedDiscountObject;
        }

        if (parsedDiscountObject.price && price < parsedDiscountObject.price)
            throw new ApiError(httpStatus.BAD_REQUEST, 'Discount price cannot be greater than price');
    }
};

function round(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const handleProductImageUploads = async (req: Request): Promise<void> => {
    if (!req.files || !req.files.images) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload an image or images');
    }

    if (req.files && req.files.images) {
        const images = req.files.images as UploadedFile[];
        if (!Array.isArray(images)) {
            const uploadedImage = await uploadImage(images);
            req.body.images = uploadedImage;
            req.body.primary_image = uploadedImage;
        } else {
            const uploadedImages = await uploadImages(images);
            req.body.images = uploadedImages;
            req.body.primary_image = uploadedImages[0];
        }
    }
};

export const formatCreateProduct = (req: Request): void => {
    try {
        req.body.price = req.body.price ? Number(req.body.price) : undefined;
        req.body.quantity = req.body.quantity ? Number(req.body.quantity) : undefined;
        req.body.weight = req.body.weight ? Number(req.body.weight) : undefined;

        const parsedDiscount = req.body.discount ? JSON.parse(req.body.discount) : undefined;

        const { size_variations, price, specification, quantity } = req.body;

        if ((parsedDiscount && !Object.keys(parsedDiscount).length) || !parsedDiscount?.price) {
            delete req.body.discount;
        }

        if (req.body.discount) {
            parsedDiscount.price = Number(parsedDiscount.price);

            if (price < parsedDiscount.price) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Discount price can not be greater than price');
            }

            req.body.discount = parsedDiscount;
            req.body.discount_percentage = getPercentageFromDiscountedPrice(price, parsedDiscount.price);
        }

        if (size_variations) {
            let parsedSizeVariations = JSON.parse(size_variations);

            parsedSizeVariations = parsedSizeVariations.map((variation: IProductSize) => {
                if (!variation.price || !variation.quantity) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Variations must have price and quantity');
                }

                variation.quantity = Number(variation.quantity);
                variation.price = Number(variation.price);
                variation.variation_id = generateString(ALPHANUMERIC_POOL, PRODUCT_VARIATION_ID_SIZE);

                if (variation.quantity == (0 || null || undefined)) {
                    variation.stock_status = StockStatus.OUT_OF_STOCK;
                } else if (variation.quantity >= 1 && variation.quantity <= 3) {
                    variation.stock_status = StockStatus.LOW_ON_STOCK;
                } else {
                    variation.stock_status = StockStatus.IN_STOCK;
                }

                if (variation.discount) {
                    variation.discount.price = Number(variation.discount.price);
                    variation.discount_percentage = getPercentageFromDiscountedPrice(
                        variation.price,
                        variation.discount.price,
                    );
                }
                return variation;
            });

            req.body.size_variations = parsedSizeVariations;
        }

        if (specification) {
            req.body.specification = JSON.parse(specification);
        }

        // Product Stock Status
        if (quantity == 0) req.body.stock_status = StockStatus.OUT_OF_STOCK;
        if (quantity >= 1 && quantity <= 3) req.body.stock_status = StockStatus.LOW_ON_STOCK;
        if (quantity > 3) req.body.stock_status = StockStatus.IN_STOCK;

    } catch (err) {
        throw new ApiError(httpStatus.BAD_REQUEST, err);
    }
};

export const formatUpdateProduct = async (product: IProductModel, req: Request): Promise<void> => {
    try {
        if (req.body.price) {
            req.body.price = req.body.price ? Number(req.body.price) : undefined;
        }

        if (req.body.quantity) {
            req.body.quantity = req.body.quantity ? Number(req.body.quantity) : undefined;
        }

        const { price, quantity, discount, size_variations, altpay_monthly_payout } = req.body;

        const isSingleProduct = price || discount || quantity || altpay_monthly_payout;

        if (product.size_variations && product.size_variations.length > 0 && isSingleProduct) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Product has size_variations, [price, discount, quantity, altpay_monthly_payout] can not be set`,
            );
        }

        if (product.price && size_variations) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Product does not have variations, size variations can not be set',
            );
        }
        if (req.body.discount) {
            if (
                req.body.discount === '{}' ||
                req.body.discount == 'null' ||
                Object.keys(req.body.discount).length === 0 ||
                req.body.discount.start_date == 'null' ||
                req.body.discount.end_date == 'null'
            ) {
                delete req.body.discount;
                await Product.updateOne(
                    { _id: product.id },
                    { $unset: { discount: 1 }, discount_percentage: 1 },
                    { new: true },
                );
            } else {
                if (req.body.discount.price) {
                    req.body.discount.price = Number(req.body.discount.price);
                }
                if (Number(product.price) < discount.price) {
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Discount price can not be greater than price');
                }

                if (price && discount.price) {
                    req.body.discount_percentage = getPercentageFromDiscountedPrice(price, discount.price);
                } else if (discount.price) {
                    req.body.discount_percentage = getPercentageFromDiscountedPrice(product.price, discount.price);
                }
            }
        }

        if (size_variations) {
            req.body.size_variations = size_variations.map((variation: IProductSize) => {
                variation.quantity = Number(variation.quantity);
                variation.price = Number(variation.price);
                variation.variation_id = generateString(ALPHANUMERIC_POOL, PRODUCT_VARIATION_ID_SIZE);

                if (variation.quantity == (0 || null || undefined)) {
                    variation.stock_status = StockStatus.OUT_OF_STOCK;
                } else if (variation.quantity >= 1 && variation.quantity <= 3) {
                    variation.stock_status = StockStatus.LOW_ON_STOCK;
                } else {
                    variation.stock_status = StockStatus.IN_STOCK;
                }

                if (variation.discount) {
                    variation.discount.price = Number(variation.discount.price);
                    variation.discount_percentage = getPercentageFromDiscountedPrice(
                        variation.price,
                        variation.discount.price,
                    );
                }
                return variation;
            });
        }

        // Product Stock Status
        if (quantity && quantity == 0) req.body.stock_status = StockStatus.OUT_OF_STOCK;
        if (quantity && quantity >= 1 && quantity <= 3) req.body.stock_status = StockStatus.LOW_ON_STOCK;
        if (quantity && quantity > 3) req.body.stock_status = StockStatus.IN_STOCK;

    } catch (err) {
        throw new ApiError(httpStatus.BAD_REQUEST, err);
    }
};

export const isProductNameValid = async (productName: string, vendor: ObjectId): Promise<boolean> => {
    const result = await Product.find({ name: productName, vendor: vendor });
    return result.length <= 0;
};

export const checkValidObjectId = (id: string): boolean => {
    if (Types.ObjectId.isValid(id)) {
        return String(new Types.ObjectId(id)) === id;
    }

    return false;
};

export const handleProductWithoutVariations = async (
    product: any,
    options: any,
): Promise<void> => {
    formatProductFields(product);
    const { error } = validateSchema(createProductSchema, product);
    if (error) throw new ApiError(httpStatus.BAD_REQUEST, error);

    const {
        name,
        brand,
        category,
        color,
        short_description,
        long_description,
        weight,
        dimensions,
        warranty,
        price,
        quantity,
        fairmall_region,
        image1,
        image2,
        image3,
        image4,
        image5,
        discount,
        status,
        is_bundle,
        is_top_deal,
    } = product;

    const productObj = new Product();
    productObj.name = name;
    productObj.sku = generateString(ALPHABET_POOL, SKU_SIZE);
    productObj.brand = brand;

    if (category) productObj.category = category;

    productObj.color = color;
    productObj.short_description = short_description;
    productObj.long_description = long_description;
    productObj.weight = weight;
    productObj.warranty = warranty;
    productObj.price = price;
    if (price && discount && discount.price)
        productObj.discount_percentage = getPercentageFromDiscountedPrice(price, discount.price);
    productObj.quantity = quantity;
    if (quantity && quantity === (0 || null || undefined)) {
        productObj.stock_status = StockStatus.OUT_OF_STOCK;
    } else if (quantity >= 1 && quantity <= 3) {
        productObj.stock_status = StockStatus.LOW_ON_STOCK;
    } else {
        productObj.stock_status = StockStatus.IN_STOCK;
    }
    if (status) productObj.status = status;
    // TODO: Download image from url and re-upload to image storage
    productObj.images = [image1, image2, image3, image4, image5];
    productObj.primary_image = image1;
    productObj.enabled = true;
    productObj.discount = isNotEmpty(discount)
        ? {
              price: discount.price,
              start_date: isNotEmpty(discount.start_date) ? discount.start_date : undefined,
              end_date: isNotEmpty(discount.end_date) ? discount.end_date : undefined
          }
        : undefined;
    if (status) productObj.status = status;
    if (is_top_deal) productObj.is_top_deal = is_top_deal;
    if (is_bundle) productObj.is_bundle = is_bundle;

    const images = [];

    if (image1) {
        images.push(image1);
    }

    if (image2) {
        images.push(image2);
    }

    if (image3) {
        images.push(image3);
    }

    if (image4) {
        images.push(image4);
    }

    if (image5) {
        images.push(image5);
    }

    if (images.length > 0) {
        productObj.images = images;
    }

    await productObj.save(options);
};

export const handleProductWithVariations = async (
    product: any,
    options: any,
): Promise<void> => {
    formatProductFields(product);

    const { error } = validateSchema(createProductSchema, product);
    if (error) throw new ApiError(httpStatus.BAD_REQUEST, error);

    const {
        name,
        brand,
        category,
        color,
        short_description,
        long_description,
        weight,
        warranty,
        size_variations,
        image1,
        image2,
        image3,
        image4,
        image5,
        is_top_deal,
        status,
        is_bundle,
    } = product;

    let parsedSizeVariations = JSON.parse(size_variations);

    parsedSizeVariations = parsedSizeVariations.map((variation: IProductSize) => {
        variation.quantity = Number(variation.quantity);
        variation.price = Number(variation.price);
        variation.variation_id = generateString(ALPHANUMERIC_POOL, PRODUCT_VARIATION_ID_SIZE);

        if (variation.quantity == (0 || null || undefined)) {
            variation.stock_status = StockStatus.OUT_OF_STOCK;
        } else if (variation.quantity >= 1 && variation.quantity <= 3) {
            variation.stock_status = StockStatus.LOW_ON_STOCK;
        } else {
            variation.stock_status = StockStatus.IN_STOCK;
        }

        if (variation.discount) {
            variation.discount.price = Number(variation.discount.price);
            variation.discount_percentage = getPercentageFromDiscountedPrice(variation.price, variation.discount.price);
        }
        return variation;
    });

    const productObj = new Product();
    productObj.name = name;
    productObj.sku = generateString(ALPHABET_POOL, SKU_SIZE);
    productObj.brand = brand;
    if (category) productObj.category = category;

    productObj.color = color;
    productObj.short_description = short_description;
    productObj.long_description = long_description;
    productObj.weight = weight;
    productObj.warranty = warranty;
    productObj.size_variations = parsedSizeVariations;
    productObj.images = [image1, image2, image3, image4, image5];
    productObj.primary_image = image1;
    productObj.enabled = true;
    if (status) productObj.status = status;
    if (is_top_deal) productObj.is_top_deal = is_top_deal;
    if (is_bundle) productObj.is_bundle = is_bundle;

    const images = [];

    if (image1) {
        images.push(image1);
    }

    if (image2) {
        images.push(image2);
    }

    if (image3) {
        images.push(image3);
    }

    if (image4) {
        images.push(image4);
    }

    if (image5) {
        images.push(image5);
    }

    if (images.length > 0) {
        productObj.images = images;
    }

    await productObj.save(options);
};

const formatProductFields = (product: any): any => {
    const keys = Object.keys(product);

    if (product.discount) {
        if (!isNotEmpty(product.discount.start_date)) delete product.discount.start_date;
        if (!isNotEmpty(product.discount.end_date)) delete product.discount.end_date;
        if (!isNotEmpty(product.discount.price)) delete product.discount;
    }

    for (const key of keys) {
        if (!isNotEmpty(product[key])) {
            delete product[key];
        }
    }

    return product;
};
