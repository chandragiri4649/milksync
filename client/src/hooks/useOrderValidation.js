/**
 * Custom Hook for Order Form Validation
 * Provides real-time validation for the multi-step order process
 */

import { useState, useCallback, useMemo } from 'react';
import {
    validateStep1,
    validateStep2,
    validateStep3,
    validateFinalSubmission,
    validateField,
    validateBusinessRules,
    formatValidationErrors
} from '../utils/orderValidation';

export const useOrderValidation = () => {
    const [validationErrors, setValidationErrors] = useState({});
    const [validationWarnings, setValidationWarnings] = useState([]);
    const [touchedFields, setTouchedFields] = useState({});
    const [isValidating, setIsValidating] = useState(false);

    // Mark field as touched
    const markFieldAsTouched = useCallback((fieldName) => {
        setTouchedFields(prev => ({
            ...prev,
            [fieldName]: true
        }));
    }, []);

    // Clear validation errors
    const clearValidationErrors = useCallback(() => {
        setValidationErrors({});
        setValidationWarnings([]);
        setTouchedFields({});
    }, []);

    // Clear specific field error
    const clearFieldError = useCallback((fieldName) => {
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    // Validate single field
    const validateSingleField = useCallback((fieldName, value, additionalData = {}) => {
        const validation = validateField(fieldName, value, additionalData);
        
        setValidationErrors(prev => ({
            ...prev,
            [fieldName]: validation.isValid ? undefined : validation.error
        }));
        
        return validation;
    }, []);

    // Validate Step 1: Distributor Selection
    const validateDistributorStep = useCallback((selectedDistributor) => {
        const validation = validateStep1(selectedDistributor);
        
        if (!validation.isValid) {
            setValidationErrors(prev => ({
                ...prev,
                ...validation.errors
            }));
        } else {
            clearFieldError('distributor');
        }
        
        return validation;
    }, [clearFieldError]);

    // Validate Step 2: Order Date
    const validateDateStep = useCallback((orderDate) => {
        const validation = validateStep2(orderDate);
        
        if (!validation.isValid) {
            setValidationErrors(prev => ({
                ...prev,
                ...validation.errors
            }));
        } else {
            clearFieldError('orderDate');
        }
        
        return validation;
    }, [clearFieldError]);

    // Validate Step 3: Products and Items
    const validateProductsStep = useCallback((products, orderItems) => {
        const validation = validateStep3(products, orderItems);
        
        if (!validation.isValid) {
            setValidationErrors(prev => ({
                ...prev,
                ...validation.errors
            }));
        } else {
            // Clear product-related errors
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.products;
                delete newErrors.orderItems;
                return newErrors;
            });
        }
        
        return validation;
    }, []);

    // Validate entire form for final submission
    const validateCompleteOrder = useCallback(async (orderData) => {
        setIsValidating(true);
        
        try {
            const { selectedDistributor, orderDate, orderItems } = orderData;
            
            // Basic validation
            const validation = validateFinalSubmission(selectedDistributor, orderDate, orderItems);
            
            if (!validation.isValid) {
                setValidationErrors(validation.errors);
                return validation;
            }
            
            // Business rules validation
            const businessValidation = validateBusinessRules(orderData);
            
            if (businessValidation.warnings.length > 0) {
                setValidationWarnings(businessValidation.warnings);
            }
            
            if (!businessValidation.isValid) {
                setValidationErrors(prev => ({
                    ...prev,
                    ...businessValidation.errors
                }));
                return businessValidation;
            }
            
            // Clear all errors if validation passes
            setValidationErrors({});
            
            return {
                isValid: true,
                errors: {},
                warnings: businessValidation.warnings
            };
            
        } finally {
            setIsValidating(false);
        }
    }, []);

    // Real-time product validation
    const validateProduct = useCallback((product) => {
        const errors = {};
        
        if (product.quantity !== "" && product.quantity !== undefined) {
            const quantityValidation = validateField('quantity', product.quantity);
            if (!quantityValidation.isValid) {
                errors.quantity = quantityValidation.error;
            }
        }
        
        const unitValidation = validateField('unit', product.unit);
        if (!unitValidation.isValid) {
            errors.unit = unitValidation.error;
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }, []);

    // Check if step is valid
    const isStepValid = useCallback((step, data) => {
        switch (step) {
            case 1:
                return validateStep1(data.selectedDistributor).isValid;
            case 2:
                return validateStep2(data.orderDate).isValid;
            case 3:
                return validateStep3(data.products, data.orderItems).isValid;
            default:
                return false;
        }
    }, []);

    // Get validation status for UI
    const getFieldValidationStatus = useCallback((fieldName) => {
        const hasError = validationErrors[fieldName];
        const isTouched = touchedFields[fieldName];
        
        return {
            hasError: !!hasError,
            errorMessage: hasError,
            isTouched,
            showError: hasError && isTouched
        };
    }, [validationErrors, touchedFields]);

    // Get formatted errors for display
    const formattedErrors = useMemo(() => {
        return formatValidationErrors(validationErrors);
    }, [validationErrors]);

    // Check if form has any errors
    const hasErrors = useMemo(() => {
        return Object.keys(validationErrors).some(key => validationErrors[key]);
    }, [validationErrors]);

    // Get error count
    const errorCount = useMemo(() => {
        return formattedErrors.length;
    }, [formattedErrors]);

    return {
        // State
        validationErrors,
        validationWarnings,
        touchedFields,
        isValidating,
        
        // Actions
        markFieldAsTouched,
        clearValidationErrors,
        clearFieldError,
        validateSingleField,
        validateDistributorStep,
        validateDateStep,
        validateProductsStep,
        validateCompleteOrder,
        validateProduct,
        
        // Helpers
        isStepValid,
        getFieldValidationStatus,
        
        // Computed
        formattedErrors,
        hasErrors,
        errorCount
    };
};

export default useOrderValidation;

