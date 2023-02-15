/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { NextFunction, Request, Response } from "../../types/app";
import { Product } from "../../models/product.model";
import { successResponse } from "../../utils/success-response";
import ApiError from "../../utils/ApiError";
import { advancedQuery } from "../../services/advancedQuery";
import asyncHandler from "../../middlewares/asyncHandler";
import {
  createProductSchema,
  validateUpdateProduct,
} from "../../controllers/products/validation";
import { Populate, Pagination } from "../../types/advancedQuery";
import { ALPHABET_POOL, generateString } from "../../services/generateString";
import {
  checkValidObjectId,
  formatCreateProduct,
  formatUpdateProduct,
  handleProductImageUploads,
  validateProductAssociation,
} from "./helpers";
import validateSchema from "../../utils/validator";
import { SKU_SIZE } from "../../utils/constant";

/**
 * @descr Get products
 * @route GET /products
 * @access public
 */
export const getProducts = asyncHandler(
  async (req: Request, res: Response): Promise<Response | void> => {
    const products = await advancedQuery(req, Product);

    return successResponse(
      httpStatus.OK,
      res,
      "Products retrieved successfully",
      products
    );
  }
);

/**
 * @descr Get single product
 * @route GET /products/:id_or_slug
 * @access public
 */
export const getProductByIdOrSlug = asyncHandler(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    const filter = checkValidObjectId(req.params.id_or_slug)
      ? { _id: req.params.id_or_slug }
      : { slug: req.params.id_or_slug };

    const product = await Product.findOne(filter);
    if (!product)
      return next(new ApiError(httpStatus.NOT_FOUND, "Product not found"));
    if (product.is_deleted)
      return next(new ApiError(httpStatus.NOT_FOUND, "Product not found"));

    return successResponse(
      httpStatus.OK,
      res,
      "Product retrieved successfully",
      product
    );
  }
);

/**
 * @descr Update product
 * @route PUT /products/:id
 * @access private
 */
export const updateProduct = asyncHandler(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    const { error } = validateUpdateProduct(req.body);

    if (error)
      return next(
        new ApiError(httpStatus.BAD_REQUEST, error.details[0].message)
      );

    let product = await Product.findById(req.params.id);
    if (!product)
      return next(new ApiError(httpStatus.NOT_FOUND, "Product not found"));
    if (product.is_deleted)
      return next(new ApiError(httpStatus.NOT_FOUND, "Product not found"));

    formatUpdateProduct(product, req);

    await validateProductAssociation(req);

    product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return successResponse(httpStatus.OK, res, "Product updated", product);
  }
);

/**
 * @descr Add product
 * @route POST /products
 * @access private
 */
export const addProduct = asyncHandler(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    const { error } = validateSchema(createProductSchema, req.body);
    if (error) return next(new ApiError(httpStatus.BAD_REQUEST, error));

    const { store } = req.body;

    // change store to vendor
    req.body.vendor = store;
    delete req.body.store;

    formatCreateProduct(req);

    await validateProductAssociation(req);
    await handleProductImageUploads(req);

    req.body.sku = generateString(ALPHABET_POOL, SKU_SIZE);

    let product = new Product(req.body);

    product = await product.save();
    product = await Product.findById(product._id);

    return successResponse(httpStatus.CREATED, res, "Product created", product);
  }
);
/**
 * @descr Delete a product
 * @route DELETE /products
 * @access private
 */
export const deleteAProduct = asyncHandler(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    const product = await Product.findById(req.params.id);
    if (!product)
      return next(new ApiError(httpStatus.NOT_FOUND, "Product not found"));

    await product.remove();

    successResponse(httpStatus.OK, res, "Product deleted successfully", {});
  }
);

const removePaginationFieldFromQuery = (req: Request): Request => {
  delete req.query["pagination"];
  return req;
};
