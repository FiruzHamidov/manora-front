import { AxiosError } from "axios";
import { toast } from "react-toastify";
import { IResponseWrapper } from "@/types/response-wrapper";

export const errorHandler = (error: AxiosError<IResponseWrapper>) => {
  if (error.response) {
    const errorMessage = error.response.data.message;
    if (typeof errorMessage === "string") {
      toast.error(errorMessage);
    } else {
      toast.error(errorMessage[0]);
    }
    return;
  }
  toast.error(error.message);
};
