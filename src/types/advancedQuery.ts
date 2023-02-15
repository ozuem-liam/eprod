export interface Pagination {
    next?: {
        page: number;
        limit: number;
    };
    prev?: {
        page: number;
        limit: number;
    };
    total: number;
}

export interface Result {
    count: number;
    pagination: Pagination;
    results: Record<string, unknown>[];
}

export interface Populate {
    path: string;
    select?: string;
    populate?: Populate;
    strictPopulate?: boolean;
    match?: Record<string, unknown>;
}
