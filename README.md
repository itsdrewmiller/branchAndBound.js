branchAndBound.js
=================

This is a simple javascript tool for running branch and bound optimization on calculations.  It depends on queue.js (https://github.com/itsdrewmiller/queue.js).

[Branch And Bound][wikipedia] is an algorithmic strategy for optimization - it's not the most efficient approach in the world, but it works on non-linear and discontinuous solution spaces.  I needed it specifically for tax optimization, where I wanted to know how to distribute deductions between my wife and I to minimize our collective taxes.  You do need to be able to come up with an upper and lower bound function for this to work.

[wikipedia]: http://en.wikipedia.org/wiki/Branch_and_bound

As a simple example, let's say we have the following function:

    2x^2y - 4xy + y

And let's say further we are subject to the following constraint:
x is either 0, 1, or 2
y is between 0 and 20

This equation has a discontinuity, which makes it difficult for many optimization techniques.  For box and bound, that isn't a problem.

    var bnb = new Bnb('min');

The first step is coming up with two equations that definitely bound the answer, for a given range of x and y.  For this equation, some goood choices would be:

    bnb.lowerBound = function(box) {
        return 2*box.x.min*box.x.min*box.y.min - 4*box.x.max*box.y.max + box.y.min;
    };

    bnb.upperBound = function(box) {
        return 2*box.x.max*box.x.max*box.y.max - 4*box.x.min*box.y.min + box.y.max;
    };


Basically, just assume either the best or worst case for each use of the variable, and calculate the whole value from that.  In general, there isn't a magical formula for figuring out these bounding functions; that's the hardest part of the branch and bound algorithm, though take heart that you don't always have to come up with something really elaborate, as long as its range narrows as your boxes get smaller.

Now, let's define the input parameters and their constraints:

    bnb.initialBox = { 
        x: { min: 0, max: 2, isDiscrete: true, splitWeight: 100 }, 
        y: { min: 0, max: 20 }
    };

The *isDiscrete* property here does what it sounds like, and the *splitWeight* gives a hint to the algorithm that even though the distance between the min and max of this variable is small, it's actually pretty important.  This kind of optimization can make a huge difference compared to naive splitting, where big distance, low impact variables by default will be split many times before low distance ones.

Because this algorithm is essentially recursive and arbitrarily specific, we want to have a couple of ways to get out of it:

    bnb.tolerance = 5;
    bnb.loopAbort = 1000000;

The tolerance here is pretty important - because this algorithm works by gradually finding smaller and smaller boxes with nearer and nearer upper and lower bounds, it may never actually reach an exact answer.  You can usually tell by examing the results what the absolute best outcome is, and in other cases you don't really care as long as it is close enough.  The loop abort is just what it sounds like - be careful setting it at more than a million or so, as the mechanism for storing all the possible boxes is semi-optimized but not perfect.  It does have a fairly low default value of 1000.

Once you've set all those things, you're ready to run:

    bnb.start(function (err, bnb) {
        console.log('Finished');
        console.log('X range = ' + bnb.bestBox.x.min + ' to ' + bnb.bestBox.x.max);
        console.log('Y range = ' + bnb.bestBox.y.min + ' to ' + bnb.bestBox.y.max);
    });

The bnb returned in the callback is the same as the one calling it, so you don't really need to handle anything in the callback if you don't want to.

Because this process can be a little time consuming, you also have the option of providing a function to be called each iteration.  Something like this:

    bnb.iteration = function (status) {
        if (!(status.count % 250)) {
            console.dir(status);
        }
    };

