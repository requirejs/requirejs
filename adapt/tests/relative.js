/*
Run this file from a directory that is not the directory containing this file
to see if the baseUrl of this file is used instead of the current directory.
*/

require(['alpha', 'beta'], function (alpha, beta) {
    console.log('alpha === ' + alpha.name);
    console.log('beta === ' + beta.name);
    console.log('betaSubName === ' + beta.subName);
});
