<a name="0.4.0"></a>
# [0.4.0](https://github.com/mulesoft-labs/api-console-builder/compare/0.3.0...v0.4.0) (2017-06-30)


### Breaking

* Bumped version to 0.4.0 as incompatible with previous release. ([4fbf718](https://github.com/mulesoft-labs/api-console-builder/commit/4fbf718))
* Renamed source control file. ([e7b6732](https://github.com/mulesoft-labs/api-console-builder/commit/e7b6732))
* Renamed the options class. ([b0d112c](https://github.com/mulesoft-labs/api-console-builder/commit/b0d112c))
* Replaced options that are related to setting an attributes on th ([463b1b2](https://github.com/mulesoft-labs/api-console-builder/commit/463b1b2))

### Docs

* Updated documentation for the module. ([4da4306](https://github.com/mulesoft-labs/api-console-builder/commit/4da4306))

### Fix

* Added missing argument to function all. ([68f4f55](https://github.com/mulesoft-labs/api-console-builder/commit/68f4f55))
* Added return statements to the function. ([44797fc](https://github.com/mulesoft-labs/api-console-builder/commit/44797fc))
* Fixed an issue on Ubuntu bash on windows which by default runs as roo ([c6b3de5](https://github.com/mulesoft-labs/api-console-builder/commit/c6b3de5))
* Fixed issue when reading redirection headers. ([b506248](https://github.com/mulesoft-labs/api-console-builder/commit/b506248))
* Fixed issue with used API. The new form of the URL class is too new.  ([9b9d997](https://github.com/mulesoft-labs/api-console-builder/commit/9b9d997))
* Fixes #1 - changed logic for getting the sources and processing them. ([28e4537](https://github.com/mulesoft-labs/api-console-builder/commit/28e4537)), closes [#1](https://github.com/mulesoft-labs/api-console-builder/issues/1)
* Reversed order when preparing build so the zip files are handled corr ([6407e89](https://github.com/mulesoft-labs/api-console-builder/commit/6407e89))

### New

* Added new `jsonFile` option to point a file name with RAML JSON data. ([4b1601e](https://github.com/mulesoft-labs/api-console-builder/commit/4b1601e))
* Added new class responsible for handling local templates and updating ([0cbe1c6](https://github.com/mulesoft-labs/api-console-builder/commit/0cbe1c6))
* Added new class responsible for setting attributes on the API console ([5b0bff1](https://github.com/mulesoft-labs/api-console-builder/commit/5b0bff1))
* added new classes to support querying and transport to GitHub. ([c0ecfa1](https://github.com/mulesoft-labs/api-console-builder/commit/c0ecfa1))
* Added separate class responsible for installing console's dependencie ([d967fa5](https://github.com/mulesoft-labs/api-console-builder/commit/d967fa5))
* Added tagVersion option to download the console for specific release. ([02baa39](https://github.com/mulesoft-labs/api-console-builder/commit/02baa39))
* Added tests to the RamlSource class. ([795ab60](https://github.com/mulesoft-labs/api-console-builder/commit/795ab60))
* Created new project class as a staring point to the module and creati ([4bb7a38](https://github.com/mulesoft-labs/api-console-builder/commit/4bb7a38))
* More test! We all like tests! It's only 3 days of woking.. ([8783aaa](https://github.com/mulesoft-labs/api-console-builder/commit/8783aaa))

### Update

* Added `test-*` to ignore list to build various version of the cons ([3f84afb](https://github.com/mulesoft-labs/api-console-builder/commit/3f84afb))
* Added check for empty or undefined items in the attributes array. ([9a74de2](https://github.com/mulesoft-labs/api-console-builder/commit/9a74de2))
* Added dependency to attribues parser. ([b56c04c](https://github.com/mulesoft-labs/api-console-builder/commit/b56c04c))
* Added engine entry to the file to mark supported versions of Node. ([12e5280](https://github.com/mulesoft-labs/api-console-builder/commit/12e5280))
* Added function to remove log file afters successful build. ([71b942a](https://github.com/mulesoft-labs/api-console-builder/commit/71b942a))
* Added local test files to ignored list. ([d1dbd91](https://github.com/mulesoft-labs/api-console-builder/commit/d1dbd91))
* Added series of build in one call to test various builds. ([bf50082](https://github.com/mulesoft-labs/api-console-builder/commit/bf50082))
* Altered the function that is responsible for constructing the `api ([1d875b1](https://github.com/mulesoft-labs/api-console-builder/commit/1d875b1))
* Changed how the errors are handled so the main library will get al ([8605b1a](https://github.com/mulesoft-labs/api-console-builder/commit/8605b1a))
* Disabled debug output in the test. ([0d313cc](https://github.com/mulesoft-labs/api-console-builder/commit/0d313cc))
* Made error message clearer in the console output. ([66c7c53](https://github.com/mulesoft-labs/api-console-builder/commit/66c7c53))
* Moved most of the functionality to different modules. ([7515733](https://github.com/mulesoft-labs/api-console-builder/commit/7515733))
* Refactored the builder to only handle polymer build. ([53de8df](https://github.com/mulesoft-labs/api-console-builder/commit/53de8df))
* Refactored the module. Now inluded modules are more single task or ([8a3a9b8](https://github.com/mulesoft-labs/api-console-builder/commit/8a3a9b8))
* Removed application conde from the plain console template as broke ([43a88e8](https://github.com/mulesoft-labs/api-console-builder/commit/43a88e8))
* Removed the `json-file` attribute from the templates and moved log ([c21e8ea](https://github.com/mulesoft-labs/api-console-builder/commit/c21e8ea))
* Removed todo list as it's done. ([bd7e687](https://github.com/mulesoft-labs/api-console-builder/commit/bd7e687))
* Renamed tests names to match the test command pattern. ([5158fb4](https://github.com/mulesoft-labs/api-console-builder/commit/5158fb4))
* Update attributes build test. ([972bbcc](https://github.com/mulesoft-labs/api-console-builder/commit/972bbcc))
* Updated `after` to `afterEach` to creat output directory after eac ([46fbc0f](https://github.com/mulesoft-labs/api-console-builder/commit/46fbc0f))
* Updated class names after refactoring. ([735acc4](https://github.com/mulesoft-labs/api-console-builder/commit/735acc4))
* Updated main file to reflect recent changes. ([e7ac6df](https://github.com/mulesoft-labs/api-console-builder/commit/e7ac6df))
* Updated structure of the options class. Added more validations rul ([4a39971](https://github.com/mulesoft-labs/api-console-builder/commit/4a39971))
* Updated suite name to not make a confusion here ([1013232](https://github.com/mulesoft-labs/api-console-builder/commit/1013232))
* Updated test cases to match new API. ([de4cc9d](https://github.com/mulesoft-labs/api-console-builder/commit/de4cc9d))



<a name="0.1.0"></a>
## pre-release

* Redesigned the module
* It now support various build methods to customize the build
* Can generate code of the API Console for standalone and embedded version
* See readme for full usage.
* Changes are backward compatible.

<a name="0.0.1"></a>
## pre-alpha

* Added basic functionality for building the api-console application

**TODO:**
* Add ability to ignore some files from the build. It's to exclude the RAML parser from the build if parser is not necessary. This will be delayed because it is not yet supported by the polymer-build project.
