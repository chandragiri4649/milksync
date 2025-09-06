/**
 * Order Placement Form Validation Utilities
 * Comprehensive validation for multi-step order process
 */

// Validation Rules
export const validationRules = {
    distributor: {
        required: true,
        message: "Please select a distributor before proceeding"
    },
    orderDate: {
        required: true,
        minDate: () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        },
        message: "Please select a valid order date (minimum tomorrow)"
    },
    quantity: {
        required: true,
        min: 0.1,
        max: 10000,
        message: "Quantity must be between 0.1 and 10,000"
    },
    unit: {
        required: true,
        allowedValues: ['tub', 'bucket', 'kg', 'liter', 'box', 'packet', 'gm'],
        message: "Please select a valid unit"
    },
    orderItems: {
        required: true,
        minItems: 1,
        maxItems: 50,
        message: "Please add at least 1 item to your order (maximum 50 items)"
    }
};

// Step Validation Functions
export const validateStep1 = (selectedDistributor) => {
    const errors = {};
    
    if (!selectedDistributor) {
        errors.distributor = validationRules.distributor.message;
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const validateStep2 = (orderDate) => {
    const errors = {};
    
    if (!orderDate) {
        errors.orderDate = validationRules.orderDate.message;
    } else {
        const selectedDate = new Date(orderDate);
        const minDate = new Date(validationRules.orderDate.minDate());
        
        if (selectedDate < minDate) {
            errors.orderDate = "Order date must be at least tomorrow";
        }
        
        // Check if selected date is too far in future (optional)
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
        
        if (selectedDate > maxDate) {
            errors.orderDate = "Order date cannot be more than 30 days in advance";
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const validateStep3 = (products, orderItems) => {
    const errors = {};
    
    // Validate individual products
    const productErrors = {};
    products.forEach(product => {
        const productId = product._id;
        
        if (product.quantity !== "" && product.quantity !== undefined) {
            // Quantity validation
            const quantity = parseFloat(product.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                productErrors[productId] = {
                    ...productErrors[productId],
                    quantity: "Please enter a valid positive number"
                };
            } else if (quantity < validationRules.quantity.min) {
                productErrors[productId] = {
                    ...productErrors[productId],
                    quantity: `Minimum quantity is ${validationRules.quantity.min}`
                };
            } else if (quantity > validationRules.quantity.max) {
                productErrors[productId] = {
                    ...productErrors[productId],
                    quantity: `Maximum quantity is ${validationRules.quantity.max}`
                };
            }
            
            // Unit validation
            if (!validationRules.unit.allowedValues.includes(product.unit)) {
                productErrors[productId] = {
                    ...productErrors[productId],
                    unit: validationRules.unit.message
                };
            }
        }
    });
    
    if (Object.keys(productErrors).length > 0) {
        errors.products = productErrors;
    }
    
    // Validate order items
    if (!orderItems || orderItems.length === 0) {
        errors.orderItems = validationRules.orderItems.message;
    } else if (orderItems.length > validationRules.orderItems.maxItems) {
        errors.orderItems = `Maximum ${validationRules.orderItems.maxItems} items allowed per order`;
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        productErrors
    };
};

export const validateFinalSubmission = (selectedDistributor, orderDate, orderItems) => {
    const errors = {};
    
    // Validate all steps
    const step1Validation = validateStep1(selectedDistributor);
    const step2Validation = validateStep2(orderDate);
    const step3Validation = validateStep3([], orderItems);
    
    if (!step1Validation.isValid) {
        Object.assign(errors, step1Validation.errors);
    }
    
    if (!step2Validation.isValid) {
        Object.assign(errors, step2Validation.errors);
    }
    
    if (!step3Validation.isValid) {
        Object.assign(errors, step3Validation.errors);
    }
    
    // Additional final checks
    if (orderItems && orderItems.length > 0) {
        const duplicateProducts = [];
        const productIds = orderItems.map(item => item.productId);
        const uniqueProductIds = [...new Set(productIds)];
        
        if (productIds.length !== uniqueProductIds.length) {
            errors.duplicateProducts = "Duplicate products found in order. Please remove duplicates.";
        }
        
        // Check for zero quantities
        const zeroQuantityItems = orderItems.filter(item => !item.quantity || item.quantity <= 0);
        if (zeroQuantityItems.length > 0) {
            errors.zeroQuantity = "Some items have zero or invalid quantities";
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Real-time validation helper
export const validateField = (fieldName, value, additionalData = {}) => {
    switch (fieldName) {
        case 'quantity':
            const quantity = parseFloat(value);
            if (!value || value === '') {
                return { isValid: true, error: null }; // Allow empty for optional fields
            }
            if (isNaN(quantity) || quantity <= 0) {
                return { isValid: false, error: "Please enter a valid positive number" };
            }
            if (quantity < validationRules.quantity.min) {
                return { isValid: false, error: `Minimum quantity is ${validationRules.quantity.min}` };
            }
            if (quantity > validationRules.quantity.max) {
                return { isValid: false, error: `Maximum quantity is ${validationRules.quantity.max}` };
            }
            return { isValid: true, error: null };
            
        case 'orderDate':
            if (!value) {
                return { isValid: false, error: validationRules.orderDate.message };
            }
            const selectedDate = new Date(value);
            const minDate = new Date(validationRules.orderDate.minDate());
            if (selectedDate < minDate) {
                return { isValid: false, error: "Order date must be at least tomorrow" };
            }
            return { isValid: true, error: null };
            
        case 'unit':
            if (!validationRules.unit.allowedValues.includes(value)) {
                return { isValid: false, error: validationRules.unit.message };
            }
            return { isValid: true, error: null };
            
        default:
            return { isValid: true, error: null };
    }
};

// Format validation errors for display
export const formatValidationErrors = (errors) => {
    const formattedErrors = [];
    
    Object.keys(errors).forEach(key => {
        if (typeof errors[key] === 'string') {
            formattedErrors.push({
                field: key,
                message: errors[key]
            });
        } else if (typeof errors[key] === 'object') {
            // Handle nested errors (like product errors)
            Object.keys(errors[key]).forEach(subKey => {
                if (typeof errors[key][subKey] === 'object') {
                    Object.keys(errors[key][subKey]).forEach(fieldKey => {
                        formattedErrors.push({
                            field: `${key}.${subKey}.${fieldKey}`,
                            message: errors[key][subKey][fieldKey]
                        });
                    });
                } else {
                    formattedErrors.push({
                        field: `${key}.${subKey}`,
                        message: errors[key][subKey]
                    });
                }
            });
        }
    });
    
    return formattedErrors;
};

// Business logic validation
export const validateBusinessRules = (orderData) => {
    const warnings = [];
    const errors = {};
    
    // Check for large orders
    if (orderData.orderItems && orderData.orderItems.length > 20) {
        warnings.push("Large order detected. Please verify all items carefully.");
    }
    
    // Check for high quantity items
    const highQuantityItems = orderData.orderItems?.filter(item => item.quantity > 100) || [];
    if (highQuantityItems.length > 0) {
        warnings.push(`High quantity items detected: ${highQuantityItems.length} items with quantity > 100`);
    }
    
    // Check for weekend orders
    if (orderData.orderDate) {
        const orderDay = new Date(orderData.orderDate).getDay();
        if (orderDay === 0 || orderDay === 6) { // Sunday = 0, Saturday = 6
            warnings.push("Weekend delivery requested. Please confirm availability with distributor.");
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings
    };
};

