import { PERMISSION_RANKING } from "helpers";
import * as yup from "yup";

export const adminPaymentSchema = yup.object({
  clientId: yup.number().required(),
  amount: yup.number().positive().min(1).required(),
});

export const adminChangePermissionSchema = yup.object({
  clientId: yup.number().required(),
  permissionLevel: yup.string().oneOf(PERMISSION_RANKING).required(),
});
