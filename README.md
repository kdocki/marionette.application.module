
This plugin allows you to define modules (and then lazy load later) on an extended Marionette.Application.

### Usage

After including the [src/marionette.application.module.js](https://raw.github.com/kdocki/marionette.application.module/master/src/marionette.application.module.js) file into your application you can use it like this.

```js
  App = Marionette.Application.extend();
   
  App.module("HulkSmash", function (HulkSmash, App, Backbone, Marionette, $, _)
  {
     // ... 
  });
  

  // create a new application called myapp
  myapp = new App();
  myapp.start();

```


### Why on earth would I use this?

*Single line explaination:* _Using a singleton for application container is hard to test in isolation without entire page refreshes_

But really, if you're not sold, let's look at a problem. I am trying to test calling App.request(`hulk:smash`).

```js
  App = new Marionette.Application;

  App.reqres.setHandler('smashing:success', function() {
    return Math.ceil(Math.random() * 20 - 10)
  });

  App.reqres.setHandler('smashing:success:positive', function() {
    return Math.abs(App.request('smashing:success')) // always return positive value
  });

  App.module("HulkSmash", function (HulkSmash, App, Backbone, Marionette, $, _)
  {
    HulkSmash.getAngry = function()
    {
      var success = App.request('smashing:success') + 10; // success should be over 10
      return Array(success+1).join('SMASH ');
    }
    
    App.commands.setHandler('hulk:smash', function() {
      var success = App.request('smashing:success');
      return success ? 'Hulk SMASH' + Array(success+1).join('!') : 'Uh-oh, hulk saw-ree'
    });
  });

```

Sure, this example is easy enough right? No DOM manipulation going on but good principles of testing should remain the same regardless of application size. 

Let's attempt to test `hulk:smash`. I want to test test edge cases here.

What happens when `smashing:success` is

  - is negative?
  - is zero?
  - is positive?


Let me use a little chai like expressions to assert some equality

```js
  App.request('hulk:smash').is.equal.to('Hulk SMASH!'); // fails except when smashing:success returns 3

```

What I'd love to do is a little dependency injection (via the App IoC container). This kind of works as seen below,

```js

  // test when zero
  App.reqres.setHandler('smashing:success', function() { return 0; });
  App.request('hulk:smash').is.equal.to('Hulk SMASH');

  // test when positive
  App.reqres.setHandler('smashing:success', function() { return 3; });
  App.request('hulk:smash').is.equal.to('Hulk SMASH!!!');

  // test when negative
  App.reqres.setHandler('smashing:success', function() { return -4; });
  assert.throw(App.request('hulk:smash'), 'RangeError')

```

The problem here is that `App` is global though so I'm not testing in isolation. It works for this example, but in a complex application we are likely to have issues from tests polluting other tests.

Another thing, is that I loose my initial `App.reqres.setHandler`. So imagine in my next test, I wanted to test that when the Hulk is angry, he always smashes more than 10 times.

```js

  App.HulkSmash.getAngry().length.is.greater.than(10) 

```

Under normal circumstances this would pass but because we are not testing in isolation `getAngry().legnth` is actually set to 6 here which is certainly less than 10.

#### So how do I fix this problem?

I can fix this by creating a new `App` for every test. Most testing frameworks have a setup or beforeEach function you can call to help with this kind of thing. This is a step closer to being awesome.

```js

  // test when zero
  App = createApp();  // how do we implement createApp function?
  App.reqres.setHandler('smashing:success', function() { return 0; });
  App.request('hulk:smash').is.equal.to('Hulk SMASH');

  // test when positive
  App = createApp();  // how do we implement createApp function?
  App.reqres.setHandler('smashing:success', function() { return 3; });
  App.request('hulk:smash').is.equal.to('Hulk SMASH!!!');

  // ... 
```

The problem now is that we would have to cram all 100,000 lines of code into a createApp() function, which doesn't scale. Chances are that you will have lots of files, one for each App.module you define.

So imagine if we broke this application apart into seperate files (like most sane developers would do).

```js
  // located in file: app.js
  function createApp()
  {
    app = new Marionette.Application.extend();

    // setHandler code omitted...

    return app;
  }

  App = createApp()

```

```js
  // located in file: apps/hulksmash/hulksmash_app.js
  App.module("HulkSmash", function (HulkSmash, App, Backbone, Marionette, $, _)
  {
    // code omitted to keep things smaller
  });
```

But now our 2nd test breaks. This is because App.HulkSmash is not defined the second time around on `createApp`

So this is where this plugin comes into play. It allows us to set modules on an Marionette.Application class, instead of the actual instance of that class.

```js
  App = Marionette.Application.extend();
  
  // located in file: app.js
  function createApp()
  {
    app = new App;
  
    // ... setHandler code omitted
    
    return app;
  }

  App = createApp()

```

And volia! This let's us create new apps all day long (well, I haven't actually sat around creating them all day long.)

Hope this isn't terribly confusing... have fun. Have a nice day!
