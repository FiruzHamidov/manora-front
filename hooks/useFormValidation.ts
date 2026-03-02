"use client";

import { useState } from "react";

interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: (value: unknown) => boolean;
  message?: string;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

export function useFormValidation(schema: ValidationSchema) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (name: string, value: unknown): string | null => {
    const rule = schema[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.toString().trim() === "")) {
      return rule.message || `${name} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value || value.toString().trim() === "") {
      return null;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      return rule.message || `${name} format is invalid`;
    }

    // Min/Max validation for numbers
    if (typeof value === "number") {
      if (rule.min !== undefined && value < rule.min) {
        return rule.message || `${name} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return rule.message || `${name} must be at most ${rule.max}`;
      }
    }

    // MinLength/MaxLength validation for strings
    if (typeof value === "string") {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        return (
          rule.message ||
          `${name} must be at least ${rule.minLength} characters`
        );
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return (
          rule.message || `${name} must be at most ${rule.maxLength} characters`
        );
      }
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return rule.message || `${name} is invalid`;
    }

    return null;
  };

  const validateForm = (formData: Record<string, unknown>): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(schema).forEach((fieldName) => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const validateSingleField = (name: string, value: unknown): boolean => {
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error || "",
    }));
    return !error;
  };

  const clearErrors = () => {
    setErrors({});
  };

  const clearFieldError = (name: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  return {
    errors,
    validateForm,
    validateSingleField,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).some((key) => errors[key]),
  };
}
