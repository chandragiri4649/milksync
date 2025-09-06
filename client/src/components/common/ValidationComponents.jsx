/**
 * Validation UI Components
 * Reusable components for displaying validation states and errors
 */

import React from 'react';

// Error Message Component
export const ErrorMessage = ({ error, className = "" }) => {
    if (!error) return null;
    
    return (
        <div className={`text-danger small mt-1 ${className}`}>
            <i className="bi bi-exclamation-circle me-1"></i>
            {error}
        </div>
    );
};

// Warning Message Component
export const WarningMessage = ({ warning, className = "" }) => {
    if (!warning) return null;
    
    return (
        <div className={`text-warning small mt-1 ${className}`}>
            <i className="bi bi-exclamation-triangle me-1"></i>
            {warning}
        </div>
    );
};

// Success Message Component
export const SuccessMessage = ({ message, className = "" }) => {
    if (!message) return null;
    
    return (
        <div className={`text-success small mt-1 ${className}`}>
            <i className="bi bi-check-circle me-1"></i>
            {message}
        </div>
    );
};

// Validation Input Component
export const ValidatedInput = ({
    type = "text",
    value,
    onChange,
    onBlur,
    placeholder,
    className = "",
    error,
    warning,
    success,
    required = false,
    disabled = false,
    ...props
}) => {
    const handleBlur = (e) => {
        if (onBlur) onBlur(e);
    };

    const getInputClassName = () => {
        let baseClass = `form-control ${className}`;
        
        if (error) {
            baseClass += " is-invalid";
        } else if (success) {
            baseClass += " is-valid";
        } else if (warning) {
            baseClass += " border-warning";
        }
        
        return baseClass;
    };

    return (
        <div className="position-relative">
            <input
                type={type}
                value={value}
                onChange={onChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                className={getInputClassName()}
                required={required}
                disabled={disabled}
                {...props}
            />
            <ErrorMessage error={error} />
            <WarningMessage warning={warning} />
            <SuccessMessage message={success} />
        </div>
    );
};

// Validation Select Component
export const ValidatedSelect = ({
    value,
    onChange,
    onBlur,
    options = [],
    placeholder = "Select an option",
    className = "",
    error,
    warning,
    success,
    required = false,
    disabled = false,
    ...props
}) => {
    const handleBlur = (e) => {
        if (onBlur) onBlur(e);
    };

    const getSelectClassName = () => {
        let baseClass = `form-select ${className}`;
        
        if (error) {
            baseClass += " is-invalid";
        } else if (success) {
            baseClass += " is-valid";
        } else if (warning) {
            baseClass += " border-warning";
        }
        
        return baseClass;
    };

    return (
        <div className="position-relative">
            <select
                value={value}
                onChange={onChange}
                onBlur={handleBlur}
                className={getSelectClassName()}
                required={required}
                disabled={disabled}
                {...props}
            >
                {placeholder && (
                    <option value="">{placeholder}</option>
                )}
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ErrorMessage error={error} />
            <WarningMessage warning={warning} />
            <SuccessMessage message={success} />
        </div>
    );
};

// Step Validation Indicator
export const StepValidationIndicator = ({ 
    stepNumber, 
    isValid, 
    isActive, 
    isCompleted,
    title,
    onClick 
}) => {
    const getStepClassName = () => {
        let baseClass = "d-flex align-items-center justify-content-center rounded-circle";
        
        if (isCompleted) {
            baseClass += " bg-success text-white";
        } else if (isActive) {
            baseClass += isValid ? " bg-primary text-white" : " bg-warning text-dark";
        } else {
            baseClass += " bg-light text-muted";
        }
        
        return baseClass;
    };

    return (
        <div 
            className={`step-indicator ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div 
                className={getStepClassName()}
                style={{ width: '40px', height: '40px' }}
            >
                {isCompleted ? (
                    <i className="bi bi-check-lg"></i>
                ) : (
                    stepNumber
                )}
            </div>
            {title && (
                <div className="mt-2 text-center small">
                    <div className={isValid ? 'text-success' : 'text-muted'}>
                        {title}
                    </div>
                </div>
            )}
        </div>
    );
};

// Validation Summary Component
export const ValidationSummary = ({ 
    errors = [], 
    warnings = [], 
    className = "",
    showTitle = true 
}) => {
    if (errors.length === 0 && warnings.length === 0) {
        return null;
    }

    return (
        <div className={`validation-summary ${className}`}>
            {errors.length > 0 && (
                <div className="alert alert-danger border-0 mb-3">
                    {showTitle && (
                        <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            <strong>Please fix the following errors:</strong>
                        </div>
                    )}
                    <ul className="mb-0">
                        {errors.map((error, index) => (
                            <li key={index}>{error.message}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {warnings.length > 0 && (
                <div className="alert alert-warning border-0 mb-3">
                    {showTitle && (
                        <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            <strong>Please review the following warnings:</strong>
                        </div>
                    )}
                    <ul className="mb-0">
                        {warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Progress Bar with Validation
export const ValidationProgressBar = ({ 
    currentStep, 
    totalSteps, 
    stepValidations = {},
    className = "" 
}) => {
    const getProgressPercentage = () => {
        return (currentStep / totalSteps) * 100;
    };

    const getProgressBarClass = () => {
        const hasErrors = Object.values(stepValidations).some(validation => 
            validation && !validation.isValid
        );
        
        if (hasErrors) {
            return "bg-warning";
        } else if (currentStep === totalSteps) {
            return "bg-success";
        } else {
            return "bg-primary";
        }
    };

    return (
        <div className={`validation-progress ${className}`}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted">
                    Step {currentStep} of {totalSteps}
                </small>
                <small className="text-muted">
                    {Math.round(getProgressPercentage())}% Complete
                </small>
            </div>
            <div className="progress" style={{ height: '8px' }}>
                <div 
                    className={`progress-bar ${getProgressBarClass()}`}
                    role="progressbar" 
                    style={{ width: `${getProgressPercentage()}%` }}
                    aria-valuenow={getProgressPercentage()}
                    aria-valuemin="0" 
                    aria-valuemax="100"
                ></div>
            </div>
        </div>
    );
};

// Validation Card Wrapper
export const ValidationCard = ({ 
    children, 
    isValid, 
    hasWarnings, 
    className = "",
    ...props 
}) => {
    const getCardClassName = () => {
        let baseClass = `card border-0 shadow-sm ${className}`;
        
        if (!isValid) {
            baseClass += " border-danger";
        } else if (hasWarnings) {
            baseClass += " border-warning";
        } else {
            baseClass += " border-success";
        }
        
        return baseClass;
    };

    return (
        <div className={getCardClassName()} {...props}>
            {children}
        </div>
    );
};

export default {
    ErrorMessage,
    WarningMessage,
    SuccessMessage,
    ValidatedInput,
    ValidatedSelect,
    StepValidationIndicator,
    ValidationSummary,
    ValidationProgressBar,
    ValidationCard
};

