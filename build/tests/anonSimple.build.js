//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../tests/anon",
    optimize: "none",
    out: "builds/anonSimple.js",
    include: ["magenta", "red", "blue", "green", "yellow"]
}
