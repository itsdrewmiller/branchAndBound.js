(function() {

    this.branchAndBound = {
        run: function (type, lowerBoundFunc, upperBoundFunc, initialBox, tolerance, iterationCallback) {

            var setBounds = function (box) {
                box.upperBound = upperBoundFunc(box);
                box.lowerBound = lowerBoundFunc(box);
            }

            var updateBoundary = function (box) {

                if (type === 'min' && box.upperBound < minUpperBound) {
                    minUpperBound = box.upperBound;
                    bestBox = box;
                    return true;
                } else if (type === 'max' && box.lowerBound > maxLowerBound) {
                    maxLowerBound = initialBox.lowerBound;
                    bestBox = box;
                    return true;
                }
                return false;
            }

            var clearBoxes = function () {

                maxUpperBound = -Infinity;
                minLowerBound = Infinity;

                for (var i = boxQueue.length - 1; i >= 0; i--) { // We are going to remove elements from this array so let's go in reverse order
                    var box = boxQueue[i];
                    if (type === 'min' && box.lowerBound > minUpperBound) {
                        var removedBox = boxQueue.splice(i, 1)[0];
                        remaining -= Math.pow(.5, removedBox.split);
                    } else if (type === 'max' && box.upperBound < maxLowerBound) {
                        var removedBox = boxQueue.splice(i, 1)[0];
                        remaining -= Math.pow(.5, removedBox.split);
                    } else {
                        if (box.lowerBound < minLowerBound) { minLowerBound = box.lowerBound; }
                        if (box.upperBound > maxUpperBound) { maxUpperBound = box.upperBound; }
                    }
                }
            }

            var splitBox = function (box) {
                var maxDistance = 0;
                var maxIndex = 0;

                var leftChild = { variables: [], split: (box.split || 0) + 1 };
                var rightChild = { variables: [], split: (box.split || 0) + 1 };

                for (var i = 0; i < box.variables.length; i++) {
                    var currentVar = box.variables[i];
                    var distance = (currentVar.weight || 1) * (currentVar.max - currentVar.min);
                    if (distance > maxDistance) {
                        maxDistance = distance;
                        maxIndex = i;
                    }

                    leftChild.variables.push({ name: currentVar.name, min: currentVar.min, max: currentVar.max, weight: currentVar.weight, isDiscrete: currentVar.isDiscrete });
                    rightChild.variables.push({ name: currentVar.name, min: currentVar.min, max: currentVar.max, weight: currentVar.weight, isDiscrete: currentVar.isDiscrete });

                }

                var maxVar = box.variables[maxIndex];

                var middle = maxVar.min + (maxVar.max - maxVar.min) * .51;

                var leftMax = middle;
                var rightMin = middle;

                if (maxVar.isDiscrete) {
                    leftMax = Math.floor(leftMax);
                    rightMin = Math.ceil(rightMin);
                }

                leftChild.variables[maxIndex].max = leftMax;
                rightChild.variables[maxIndex].min = rightMin;

                setBounds(leftChild);
                setBounds(rightChild);

                return { leftChild: leftChild, rightChild: rightChild };

            }

            var boxQueue = [initialBox];
            var bestBox = initialBox;

            setBounds(initialBox);

            var minUpperBound, maxUpperBound, maxLowerBound, minLowerBound;
            var remaining = 1;

            if (type === 'min') {
                minUpperBound = initialBox.upperBound; // We want the minimum upper bound
                maxUpperBound = initialBox.upperBound;
            } else if (type === 'max') {
                maxLowerBound = initialBox.lowerBound; // we want the maximum lower bound
                minLowerBound = initialBox.lowerBound;
            } else {
                throw 'Invalid optimization type';
            }

            var abortAt = 500000;
            var count = 0;

            while (count++ < abortAt) {
                // pick a box to split
                var boxToSplit = boxQueue.splice(0, 1)[0];
                // pick a variable to split on
                var result = splitBox(boxToSplit);
                var leftChild = result.leftChild;
                var rightChild = result.rightChild;
                boxQueue.push(leftChild);
                boxQueue.push(rightChild);

                if (updateBoundary(leftChild)) {
                    clearBoxes();
                }

                if (updateBoundary(rightChild)) {
                    clearBoxes();
                }

                if (typeof iterationCallback === 'function') {
                    if (type === 'min') { iterationCallback(remaining, minLowerBound, minUpperBound); }
                    if (type === 'max') { iterationCallback(remaining, maxLowerBound, maxUpperBound); }
                }

                if (type === 'min' && (minUpperBound - minLowerBound) <= tolerance) {
                    console.log(count);
                    return bestBox;
                } else if (type === 'max' && (maxUpperBound - maxLowerBound) <= tolerance) {
                    return bestBox;
                } 
            }

        }
    }
})();
