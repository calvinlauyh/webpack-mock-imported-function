// test_import_whole_module.js - Begin
import { doSomething } from '../app';
import * as Utils from '../utils';

// `console.log(Utils, 'fetchData');` is transformed to
console.log(Utils, 'fetchData'); // as if Utils.fetchData()
// test_import_whole_module.js - End