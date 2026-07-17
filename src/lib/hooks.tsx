import { useState, useCallback } from "react";
import { type ZodSchema } from "zod";

type Errors = Record<string, string>;

export function useFormValidation<T>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<Errors>({});

  const validate = useCallback(
    (data: unknown): data is T => {
      const result = schema.safeParse(data);
      if (result.success) {
        setErrors({});
        return true;
      }
      const newErrors: Errors = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!newErrors[path]) {
          newErrors[path] = issue.message;
        }
      }
      setErrors(newErrors);
      return false;
    },
    [schema]
  );

  const clearErrors = useCallback(() => setErrors({}), []);

  const clearField = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { errors, validate, clearErrors, clearField };
}

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>;
}
