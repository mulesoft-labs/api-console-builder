# Version 6 upgrade.

## The reason

API Console has been upgraded to version 6. It comes with complete rewrite of sources.
The Console now uses LitElement instead of Polymer and follows @open-wc recommendations for building and application. This requires complete rewrite of building logic, from installing dependencies, managing content, to bundling.

Because the complexity of the build process in v5 the version 2 of this module will only support version 6 of the console.


## The flow:

-   [x] create tmp folder
-   [x] run AMF parser
-   [x] copy api model to working dir
-   [x] copy templates from `templates/`
-   [x] install dependencies
-   [x] copy theme file if set by the user
-   [x] copy `index.html` file if set by the user
-   [x] update `index.html` title from AMF model
-   [x] update attributes
-   [x] create vendor package
-   [x] run rollup build
-   [x] copy working dir to final destination
-   [x] cache result
-   [x] cleanup
-   [ ] tests
