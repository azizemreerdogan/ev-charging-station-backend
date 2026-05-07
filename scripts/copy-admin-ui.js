import { mkdirSync, copyFileSync } from "node:fs";

mkdirSync("dist/modules/admin/ui", { recursive: true });
copyFileSync(
    "src/modules/admin/ui/index.html",
    "dist/modules/admin/ui/index.html",
);
console.log("Copied admin UI to dist/");
