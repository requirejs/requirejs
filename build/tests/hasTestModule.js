/**
 * Just a test module that tests has replacements. Not usable on its own.
 */
define(function (require) {
    var foo, bar, baz, blurp, bat, blip;

    if (has("aTrueValue")) {
        foo = "is true";
    } else {
        foo = "is false";
    }

    if (has("aFalseValue")) {
        bar = "is true";
    } else {
        bar = "is false";
    }

    if (has("some skipped value")) {
        baz = "what";
    } else {
        baz = "ever";
    }

    blurp = has("aTrueValue") ? "OK" : "FAIL";
    bat = has ('aFalseValue') ? "FAIL" : "OK";
    blip = has("some skipped value") ? "what" : "ever";

    return foo + bar + baz + blurp + bat + blip;
});
