# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.5](https://github.com/mulesoft-labs/api-console-builder/compare/v0.4.4...v2.0.5) (2020-01-31)


### Bug Fixes

* Adding fix for styles to the import file. ([25a4f50](https://github.com/mulesoft-labs/api-console-builder/commit/25a4f50ac91151abdc958d6a9d5e0f1cbfda50c5))
* Adding missing support for noOauth and OAuth element ([26dc181](https://github.com/mulesoft-labs/api-console-builder/commit/26dc181a1e7c6bbb4c488c2031ea91aba35c6b32))
* fixes bundling command for Windows platform ([63b7ae8](https://github.com/mulesoft-labs/api-console-builder/commit/63b7ae8e53003396e1cc166af5fef1f03b6ec80f))
* Fixes https://github.com/mulesoft-labs/api-console-cli/issues/29 ([deb3cc6](https://github.com/mulesoft-labs/api-console-builder/commit/deb3cc60c6c8c87651438b230e3c9ad4fbc3e866))
* fixing logger call to undefined function ([71d7cbe](https://github.com/mulesoft-labs/api-console-builder/commit/71d7cbebe58a78e4f5e0226c620f995027434f1f))
* Fixing npm audit and dependency version ([ac03277](https://github.com/mulesoft-labs/api-console-builder/commit/ac0327714126eb46336fd23688faaaac9e7513b2))
* Fixing script error ([d569f04](https://github.com/mulesoft-labs/api-console-builder/commit/d569f04d98209d93a3902e1989cdb85f07c39c68))
* Fixing stable build ([ed81de6](https://github.com/mulesoft-labs/api-console-builder/commit/ed81de6c8dd062ab43d620ef3ec05b2c36954ebf))
* Fixing test command to increase memory limit ([4dabb93](https://github.com/mulesoft-labs/api-console-builder/commit/4dabb93700ad1aa3558c267ea6d89618905095ab))
* Refactoring misspelling ([da13f77](https://github.com/mulesoft-labs/api-console-builder/commit/da13f777719b1a76e972fb69739b86b85b2a16e2))
* Upgrading dependencies for security vulnerability ([40efb2f](https://github.com/mulesoft-labs/api-console-builder/commit/40efb2f5e2d5ea136ac537d7575e6d37f505aa3a))

<a name="1.0.11"></a>
## 1.0.11 (2020-01-13)


* Bumping version ([e01d4cf](https://github.com/mulesoft-labs/api-console-builder/commit/e01d4cf))

### chore

* chore: adding main bundle process flow ([b23b89c](https://github.com/mulesoft-labs/api-console-builder/commit/b23b89c))
* chore: finalizing builder development ([5e5981a](https://github.com/mulesoft-labs/api-console-builder/commit/5e5981a))
* chore: moving vendor generation to the tmp folder ([dac93fa](https://github.com/mulesoft-labs/api-console-builder/commit/dac93fa))
* chore: starting rewriting the component for APIC v6 ([3e02f50](https://github.com/mulesoft-labs/api-console-builder/commit/3e02f50))

### Fix

* Fix: Fixing test command to increase memory limit ([4dabb93](https://github.com/mulesoft-labs/api-console-builder/commit/4dabb93))
* Fix: Upgrading dependencies for security vulnerability ([40efb2f](https://github.com/mulesoft-labs/api-console-builder/commit/40efb2f))

### Update

* Update: Adding additional debug output ([7606de3](https://github.com/mulesoft-labs/api-console-builder/commit/7606de3))
* Update: Removing theme installation as it is installed with APIC ([e08ad02](https://github.com/mulesoft-labs/api-console-builder/commit/e08ad02))
* Update: Restoring theme installation ([890308e](https://github.com/mulesoft-labs/api-console-builder/commit/890308e))



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
