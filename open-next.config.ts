import type { OpenNextConfig } from "@opennextjs/aws/types/open-next.js";

const config = {
    default: {
        override: {
            wrapper: "cloudflare-node",
            converter: "edge",
            proxyExternalRequest: "fetch",
            incrementalCache: "dummy",
            tagCache: "dummy",
            queue: "dummy",
        },
    },
    edgeExternals: ["node:crypto"],
    middleware: {
        external: true,
        override: {
            wrapper: "cloudflare-edge",
            converter: "edge",
            proxyExternalRequest: "fetch",
            incrementalCache: "dummy",
            tagCache: "dummy",
            queue: "dummy",
        },
    },
    dangerously: {
        disableNodeModulesSymlink: true
    },
    build: {
        // Exclude large image optimization and open graph dependencies from the edge bundle
        // since Cloudflare has a strict 3MB size limit on the free tier.
        external: ["@vercel/og", "resvg.wasm", "yoga.wasm", "satori"],
    }
};

export default config as OpenNextConfig;
