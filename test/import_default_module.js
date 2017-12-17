// test_import_default_module.js - Begin
import { doSomething } from '../app';
import fetchData from '../utils_default';

// `console.log(fetchData);` is transformed to
console.log(fetchData);
// test_import_default_module.js - End