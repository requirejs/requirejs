To create a stand-alone version of this sample from the source tree version:

- Create a build fo require.js with just the minium feature set, minified.
- Put that require.js in webapp/scripts
- Point app.html to the webapp/scripts/require.js
- Copy requirejs folder with just the following:
  - build
  - require.js
  - require
  - LICENSE
  and put it as a sibling to webapp.
- Modify the app.build.js to use the requirejs build stuff in that sibling directory.
