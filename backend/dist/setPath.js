"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const setPath = (path, data, value) => {
    const objectPath = path.split(":");
    return (0, lodash_1.setWith)((0, lodash_1.clone)(data), objectPath, value, lodash_1.clone);
};
exports.default = setPath;
