/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * @param query - req query
 * @return {req query} - append options to req query containing regex
 * */
export const formatReqQueryWithRegex = (query: any): any => {
    // cast array back to object
    return Object.fromEntries(
        // cast query object into array of tuples --> [[a, b], [c, d]] and loop through the array
        Object.entries(query).map((x) =>
            // loop through the tuples and find objects
            x.map((item: any) => {
                // check if objects in tuple contains $regex key and add $options as key value pair in the object
                if (typeof item === 'object' && !Array.isArray(item) && item['$regex']) {
                    item['$options'] = 'i';
                }
                return item;
            }),
        ),
    );
};
