//This file is used by my jquery fork to build require for the
//integrated jquery build.
{
    baseUrl: ".",
    out: "dist/require-jquery-lib.js",
    optimize: "none",

    includeRequire: true,
    skipModuleInsertion: true,
    pragmas: {
        jquery: true,
        requireExcludeModify: true,
        requireExcludePlugin: true,
        requireExcludePageLoad: true,
        requireExcludeContext: true
    }
}
