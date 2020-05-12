import { AxiosError } from "axios";
export declare class Problem extends Error {
    private static makeMessage;
    readonly type: string;
    readonly title: string;
    readonly status?: number;
    readonly detail?: string;
    readonly instance?: string;
    constructor({ title, type, status, detail, instance }: ProblemMembers);
}
interface ProblemMembers {
    title: string;
    type?: string;
    status?: number;
    detail?: string;
    instance?: string;
}
export declare function problemResponseInterceptor(error: AxiosError): Promise<AxiosError | Problem>;
export {};
