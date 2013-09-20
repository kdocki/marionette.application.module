function assert(bool)
{
    if (bool !== true) {
        throw 'Assertion not valid!';
    }
}

function awesome(number)
{
    return function() {
        return "awesome" + number;    
    }
}

var loaded = {
    'SeperateMod': 0,
    'Module1': 0,
    'Module2': 0,
}


test0 = new Marionette.Application
test0.module('SeperateMod', function() { loaded['SeperateMod']++; })

// make sure we can still use Marionette.Application as normal
assert (loaded['SeperateMod'] === 1)
assert (typeof test0.SeperateMod !== 'undefined')

TestApp = Marionette.Application.extend()
TestApp.module('Module1', function() { loaded['Module1']++; })

// make sure Module1 is not loaded yet
assert (loaded['Module1'] === 0)

test1 = new TestApp;

// can we access the Module1 now? and Module1 has been loaded?
assert (typeof test1.Module1 !== 'undefined')
assert (typeof test1.Module2 === 'undefined')

// the other modules not loaded, right?
assert (loaded['SeperateMod'] === 1)
assert (loaded['Module1'] === 1)
assert (loaded['Module2'] === 0)

TestApp.module('Module2', function() { loaded['Module2']++; })
test2 = new TestApp;

// check that Module1 and Module2 were loaded again when test2 constructed
assert (typeof test2.Module2 !== 'undefined')
assert (loaded['Module1'] === 2)
assert (loaded['Module2'] === 1)

test1.start();
test2.start();
test1.reqres.setHandler('foo:bar', awesome(1))
test2.reqres.setHandler('foo:bar', awesome(2))

// make sure test1 and test2 apps are not polluting each other's
// events in reqres
assert (test1.request('foo:bar') === 'awesome1')
assert (test2.request('foo:bar') === 'awesome2')

// make sure that test1 doesn't have Module2 but test2 should
assert (typeof test1.Module2 === 'undefined')
assert (typeof test2.Module2 !== 'undefined')

TestApp.module('Module3', function() { this.args = arguments; this.self = this; });
test3 = new TestApp;
test3.start();

// make sure that argument count is correct
assert (test3.Module3.args.length === 6)

// make sure context is correct
assert (test3.Module3.self === test3.Module3)
assert (test3 === test3.Module3.args[1])
