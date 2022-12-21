import { FormInstance } from "ui";
import { ValidationError } from "yup";

export function useFormFields<T extends object>(
  form: FormInstance<T>,
  ...fields: Array<keyof T>
) {
  function clearErrors() {
    form.setFields(
      fields.map((field) => ({
        name: field as string,
        errors: [],
      }))
    );
  }

  function handleError(error: unknown) {
    if (error instanceof ValidationError) {
      for (const field of fields) {
        if (error.path === field) {
          form.setFields([
            {
              name: field,
              errors: [error.message],
            },
          ]);
        }
      }
    }
  }

  return {
    clearErrors,
    handleError,
  };
}
