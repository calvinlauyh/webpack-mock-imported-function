# Background
When writing test cases you sometimes want to control the behaviour of a certain function so that you can force the code to enter certain path, which is — mocking. Recently, I am trying to write such a test case. The challenge is that I am using webpack to bundle the code together and the function I want to mock is imported from another module in the target file.

The basic file structure is like this. I have two files:

utils.js (The module with the function I want to mock)
```
export function fetchData() {
  return [{ name: 'Tom'}, { name: ‘Mary' }];
}
```

app.js (The file I want to test)
```
import { fetchData } from './utils’; // This is the function I want to mock

export function doSomething() {
    // so that I can control how fetchData() behave here
    fetchData();
}
```

# Solution

After some research on the internet, I found a solution on StackOverflow https://stackoverflow.com/a/38414108/3259983. What it suggest is in the test file do the following:
```
import sinon from ‘sinon’;
import * as ModuleToMock from ‘./utils’; // Import the whole module
import TestingModule from ‘./app’;

it(‘should do something’, () => {
    before(() => {
        // Mock ModuleToMock.doSomething() using mocking library
        sinon.stub(ModuleToMock, ‘doSomething’).returns(true);
    });
    // doSomething will call the mocked ModuleToMock.doSomething()
    TestingModule.doSomething();
});
```

# How does it works?
After finding this solution the first thing that comes to my mind is how does it work? So I decide I should investigate further on how webpack works. If you only want to find a way to mock you imported functions then you can stop here.

I have two questions in my head :
1. Why the app.js is able to use the functions that is mocked in another file (the test file)?
2. Why do I need to import the whole module in `import * as ModuleToMock from …`? Can I import only the function or import the default module?

To understand the solution, I have created a simple webpack application that tries to import using different methods. The source code are on Github:
https://www.github.com/yuhlau/webpack-mock-imported-function

Important folders and files explain
app.js
Testing application, contains the code I want to write test cases for
utils.js
Provides function used by `app.js`, contains the function I need to mock
test/import_function.js
Test case written by importing only the needed function from `utils`
test/import_default_module.js
Test case written by importing the default module from `utils`
test/import_whole_module.js
Test case written by importing the whole module of `utils`
dist/
folder containing the webpack builds of the test files

Once cloned, you can go to the directory and execute the command
```
npm run build
```

# Code Study
Let’s us first study the built file `dist/test_import_whole_module.js`, the test file is transformed into the follow code snippet
```
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {
"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__app__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils__ = __webpack_require__(0);
// test_import_whole_module.js - Begin

// `console.log(Utils, 'doSomething');` is transformed to
console.log(__WEBPACK_IMPORTED_MODULE_1__utils__, 'doSomething');

// test_import_whole_module.js - End
/***/

The line console.log(Utils, 'doSomething'); is transformed to
console.log(__WEBPACK_IMPORTED_MODULE_1__utils__, 'doSomething');
```

If we trace the code, `__WEBPACK_IMPORTED_MODULE_1__utils__` is from the line
`/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils__ = __webpack_require__(0);`
We do not exactly know what `__webpack_require__(0)` is for, but judging from the name it should be a function to require some code. So we further trace it.
```
// The require function
function __webpack_require__(moduleId) {
    // Check if module is in cache
    if(installedModules[moduleId]) {
        return installedModules[moduleId].exports;
    }
    // Create a new module (and put it into the cache)
 (The code is slightly changed in format for better illustration)
```

What `__webpack_require__(moduleId)` does is it will first check if the module is in cached in the variable installedModules. If yes it will return it to the code, otherwise it will load the code, cache it and return.

This solve my first question: "Why the app.js is able to use the functions that is mocked in another file (the test file)?”. Since no matter you are importing it inside the test file or in the `app.js`, they will be importing the same cached module, when I mock one of the function of the module, `app.js` will also “see” the mocked object as well because there are importing the same object.

To solve my second question, let’s compare the code generated using different import methods:

### Import function only
```
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils__ = __webpack_require__(0);
…
// `console.log(fetchData); is transformed to`
console.log(__WEBPACK_IMPORTED_MODULE_1__utils__["fetchData"]);
```

### Import default module
```
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils__ = __webpack_require__(4);
...
// `console.log(fetchData);` is transformed to
console.log(__WEBPACK_IMPORTED_MODULE_1__utils_default__["a" /* default */]);
```

### Import whole module
```
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils__ = __webpack_require__(0);
…
// `console.log(Utils, 'doSomething');` is transformed to
console.log(__WEBPACK_IMPORTED_MODULE_1__utils__, 'doSomething');
```

First notice that in the three import methods, the line
`/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__utils__ = __webpack_require__(0);`
is always the same (In import default example 0 is changed to 4 but it is only because it is importing a similar file with default export), which means that the whole module is always loaded to the code.

Then we study the another line. First we study importing function only, if we import only the function using `import { fetchData } from ‘./utils'`, the code only have access to `__WEBPACK_IMPORTED_MODULE_1__utils__["fetchData"]` so it gives no way for a mocking library to mock the function.

How about import default module? When you do `import * as ModuleToMock from './utils';`, webpack will treat it as you are importing the default exported object from utils.js, so you will get a `__WEBPACK_IMPORTED_MODULE_1__utils__["a" /*default*/]` when you are trying to access the imported fetchData function in the code.

And finally in the import whole module example, it transformed  Utils to `__WEBPACK_IMPORTED_MODULE_1__utils__` which gives you access to the "root" of the exported module so that you can mock both the named export and default export.

# Limitation
This methods work on module with named export. If the module exports a function directly, i.e.
`module.exports = function notDefaultNorNamed() {}`
There is no object exported and thus we cannot change or mock the function because we have no object member to change with.

# Conclusion
So this is how we can mock an imported module/function and the mechanism behind the webpack scene. Please feel me to raise an issue if I made any mistake.