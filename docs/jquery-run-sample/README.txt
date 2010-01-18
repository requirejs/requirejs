To create a stand-alone version of this sample from the source tree version:

- Create a build fo run.js with just the minium feature set, minified.
- Put that run.js in webapp/scripts
- Point app.html to the webapp/scripts/run.js
- Copy runjs folder with just the following:
  - build
  - run.js
  - run
  - LICENSE
  and put it as a sibling to webapp.
- Modify the app.build.js to use the runjs build stuff in that sibling directory.
