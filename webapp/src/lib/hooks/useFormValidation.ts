import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
}

export interface FormValidationReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validate: () => boolean;
  handleInputChange: (
    field: keyof T
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  reset: () => void;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues,
}: UseFormValidationOptions<T>): FormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    const result = schema.safeParse(values);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof T, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof T;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    clearAllErrors();
    return true;
  }, [values, schema, clearAllErrors]);

  const handleInputChange = useCallback(
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setValue(field, value);

      if (errors[field]) {
        clearError(field);
      }
    },
    [errors, setValue, clearError]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const isValid =
    Object.keys(errors).length === 0 && Object.values(errors).every((error) => !error);

  return {
    values,
    errors,
    isValid,
    setValue,
    setError,
    clearError,
    clearAllErrors,
    validate,
    handleInputChange,
    reset,
  };
}
