branchAndBound.js
=================

This is a simple javascript tool for running branch and bound optimization on calculations.  It depends on queue.js (https://github.com/itsdrewmiller/queue.js).

Branch And Bound is an algorithmic strategy for optimization - it's not the most efficient approach in the world, but it works on non-linear and discontinuous solution spaces.  I needed it specifically for tax optimization, where I wanted to know how to distribute deductions between my wife and I to minimize our collective taxes.  You do need to be able to come up with an upper and lower bound function for this to work.
