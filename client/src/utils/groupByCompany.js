// src/utils/groupByCompany.js
export function groupByCompany(products) {
    return products.reduce((acc, product) => {
        if (!acc[product.company]) {
            acc[product.company] = [];
        }
        acc[product.company].push(product);
        return acc;
    }, {});
}
