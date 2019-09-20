"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const content_type_1 = __importDefault(require("content-type"));
const urijs_1 = __importDefault(require("urijs"));
function actionToHttpRequest(action, resolver) {
    return __awaiter(this, void 0, void 0, function* () {
        const fields = action.fields || [];
        const fieldValues = yield resolveAllFieldValues(fields, resolver);
        const requestMethod = action.method ? action.method : "GET";
        if (requestMethod === "GET") {
            return Promise.resolve({
                url: action.href,
                method: action.method,
                params: fieldValues,
                paramsSerializer: params => {
                    return urijs_1.default.buildQuery(params);
                },
                data: {} // Need to set this because of https://github.com/axios/axios/issues/86
            });
        }
        else {
            return Promise.resolve({
                url: action.href,
                method: action.method,
                data: fieldValues,
                transformRequest: [jsonRequestTransformer, failIfNotBuffer],
                headers: {
                    "Content-Type": action.type
                }
            });
        }
    });
}
exports.default = actionToHttpRequest;
function jsonRequestTransformer(data, headers) {
    const rawContentType = headers["Content-Type"];
    if (!rawContentType) {
        return data;
    }
    const parsedContentType = content_type_1.default.parse(rawContentType).type;
    if (parsedContentType !== "application/json") {
        return data; // pass on data to the next transformer
    }
    return Buffer.from(JSON.stringify(data), "utf-8");
}
function failIfNotBuffer(data, headers) {
    if (data && !Buffer.isBuffer(data)) {
        throw new Error(`Failed to serialize data for content-type ${headers["Content-Type"]}`);
    }
    return data;
}
function resolveAllFieldValues(fields, resolver) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {};
        if (!resolver) {
            return Promise.resolve(data);
        }
        for (const field of fields) {
            const value = yield resolver(field);
            if (value) {
                data[field.name] = value;
            }
        }
        return Promise.resolve(data);
    });
}
//# sourceMappingURL=actionToHttpRequest.js.map