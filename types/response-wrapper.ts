export interface IResponseWrapper<T = undefined> {
  message: string;
  payload: T;
}
