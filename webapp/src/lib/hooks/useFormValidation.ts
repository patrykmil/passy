import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
}

export interface FormValidationReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  validate: () => boolean;
  handleInputChange: (
    field: keyof T
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
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

    setErrors({});
    return true;
  }, [values, schema]);

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

  return {
    values,
    errors,
    setValue,
    setError,
    clearError,
    validate,
    handleInputChange,
  };
}
