"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = void 0;
var world = 'world';
function hello(word) {
    if (word === void 0) { word = world; }
    return "Hello " + world + "! ";
}
exports.hello = hello;
console.log("Hello");
hello();
//# sourceMappingURL=index.js.map