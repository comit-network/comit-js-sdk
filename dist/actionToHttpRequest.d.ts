import { AxiosRequestConfig } from "axios";
import { Action, Field } from "../gen/siren";
export declare type FieldValueResolverFn = (field: Field) => Promise<string | undefined>;
export default function actionToHttpRequest(action: Action, resolver?: FieldValueResolverFn): Promise<AxiosRequestConfig>;
