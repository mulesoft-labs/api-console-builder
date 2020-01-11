# Version 6 upgrade.

## The reason

API Console has been upgraded to version 6. It comes with complete rewrite of sources.
The Console now uses LitElement instead of Polymer and follows @open-wc recommendations for building and application. This requires complete rewrite of building logic, from installing dependencies, managing content, to bundling.

Because the complexity of the build process in v5 the version 2 of this module will only support version 6 of the console.


## The flow:

-   create tmp folder
-   run AMF parser
-   copy api model to working dir
-   copy templates from `templates/`
-   copy theme file if set by the user
-   copy `index.html` file if set by the user
-   update version of APIC in the `package.json` (working dir)
-   update `index.html` title from AMF model
-   install dependencies
-   update attributes
-   run rollup build
-   copy working dir to final destination
