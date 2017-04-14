var TestModule = require('./test_module');
var Foo = TestModule.Foo;
var Bar = require('./test_default_module');
Foo();
Bar();
