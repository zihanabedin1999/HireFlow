"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const logger_1 = __importDefault(require("./utils/logger"));
async function main() {
    try {
        logger_1.default.info('Starting LinkedIn Sourcing Agent...');
        await (0, server_1.startServer)();
    }
    catch (error) {
        logger_1.default.error('Application startup failed:', error);
        process.exit(1);
    }
}
process.on('SIGINT', () => {
    logger_1.default.info('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger_1.default.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
main();
//# sourceMappingURL=index.js.map