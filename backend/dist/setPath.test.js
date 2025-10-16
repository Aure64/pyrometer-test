"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const setPath_1 = __importDefault(require("./setPath"));
describe("setPath", () => {
    const data = {};
    const result = (0, setPath_1.default)("a:b:c", data, 1);
    it("sets path", async () => {
        expect(result).toEqual({ a: { b: { c: 1 } } });
    });
    it("does not mutate data", async () => {
        expect(data).toEqual({});
    });
});
