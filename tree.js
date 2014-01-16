(function ($) {

    var methods = {

        init : function (options) {
            
            var settings = $.extend({'title':''}, options);

            return this.each(function () {
                // Get tree data
                data = $(this).data('tree');

                // If data is not yet set, initialize with root
                if (!data) {
                    $(this).data('tree',{'root':$(this)});
                    data = $(this).data('tree');
                }

                $(this).addClass('root');

                // Wrap the tree UL in a div for DOM searching purposes
                $(this).wrap('<div class="one-tree-forest" />');
                data.wrapper = $(this).parent();

                // Add a title
                if (settings.title != '')
                {
                    data.wrapper.prepend('<h1>'+settings.title+'</h1>');
                }

                // Wrap the text in the LIs inside divs
                data.wrapper.find('li').each(function () {
                    $($(this).contents().get(0)).wrap('<div class="tree-node" />');
                });

                // Draw the tree!
                methods.drawTree($(this));
            });

        },

        drawTree : function (list) {

            data = list.data('tree');

            wrapper = data.wrapper;

            // Take sample sizes
            data.nodeWidth = parseInt(wrapper.find('div.tree-node:first').css('width'));
            data.nodeHeight = parseInt(wrapper.find('div.tree-node:first').css('height'));
            data.horizontalSpacing = parseInt(wrapper.find('ul:first').css('padding-left')) * 2;
            data.verticalSpacing = parseInt(wrapper.find('li:first').css('margin-top'));
            data.marginTop = data.verticalSpacing / 2;
            data.marginBottom = data.marginTop + 1;

            // Set data for each child so that it knows its own parent
            wrapper.find('ul:not(.root), li').data('tree', {'root':list});

            // Add the top and bottom lines that poke out of nodes as well as the horizontal connectors 
            wrapper
                .find('li:not(:has(.tree-node-top))')
                    .append('<div class="tree-node-top tree-line"></div>').end()
                .find('li:not(:has(.tree-node-bottom))')
                    .append('<div class="tree-node-bottom tree-line"></div>').end()

                // I'm adding divs to the uls, which isn't allowed but works anyway. I might change this to make standards happy
                .find('ul:not(:has(.tree-branch-horizontal))')
                    .append('<div class="tree-branch-horizontal tree-line"></div>').end()

                // Make sure every li has a child ul for future children
                .find('li:not(:has(ul))')
                    .append('<ul></ul>')
                    .find('ul')
                        .data('tree', {'root':list}).end().end()
                .find('ul')
                    .css('min-width', data.tree - data.nodeWidth).end()
                .find('li .tree-node-top')
                    .css('top', '-' + data.marginTop + 'px').end()
                .find('li .tree-node-bottom')
                    .css('top', data.nodeHeight + 1 + 'px').end()

                // Activate the lines that poke out of the top on li's that are children
                .find('ul li .tree-node-top')
                    .css('height', data.marginTop+'px').end()

                // Activate the lines that poke out the bottom on li's that have children
                .find('li:has(li) > .tree-node-bottom')
                    .css('height', data.marginBottom+'px').end()
                // Deactivate the lines that poke out the bottom on li's that do not have children
                .find('li:not(:has(li)) > .tree-node-bottom')
                    .css('height', '0px').end()

                // Connect all the vertical lines with big horizontal ones
                .find('ul:has(li)').each(function () {

                    if ($(this).find('> li:visible').length) {

                        var left = $(this).find('> li:visible:first > .tree-node-top').offset().left - $(this).offset().left;
                        var right = parseInt($(this).css('width')) - ($(this).find('> li:visible:last > .tree-node-top').offset().left - $(this).offset().left) + data.horizontalSpacing;
                        
                        $(this).find('> .tree-branch-horizontal').css({
                            'top': data.marginTop+'px',
                            'left': left+'px',
                            'right': right+'px'
                        });

                    }

                }).end()

                // Make LIs draggable
                .find('li').draggable({
                    stack: 'body',
                    handle: '> div.tree-node',
                    helper: 'clone',
                    appendTo: wrapper,
                    scroll: true,
                    revert: 'invalid',
                    start: methods.onDragStart,
                    stop: methods.onDragStop,
                    drag: methods.onDrag
                }).end()

                // Make ULs droppable
                .find('ul:not(>li ul, li.ui-draggable-dragging ul)').droppable({
                    greedy: false,
                    tolerance: methods.handleTouch,
                    over: methods.onOver,
                    out: methods.onOut,
                    drop: methods.onDrop,
                    deactivate: methods.onDeactivate
                });

            // end wrapper

        },

        getRootData : function (element) {
            return $(element).data('tree').root.data('tree');
        },

        handleTouch : function (draggable, droppable) {

            var handle = $(draggable.helper).find('div.tree-node');

            var x1 = handle.offset().left, x2 = x1 + handle.css('width'),
                y1 = handle.offset().top, y2 = y1 + handle.css('height');

            var l = droppable.offset.left, r = l + droppable.proportions.width,
                t = droppable.offset.top, b = t + droppable.proportions.height;

            return (
                (y1 >= t && y1 <= b) || // Top edge touching
                (y2 >= t && y2 <= b) || // Bottom edge touching
                (y1 < t && y2 > b)      // Surrounded vertically
            ) && (
                (x1 >= l && x1 <= r) || // Left edge touching
                (x2 >= l && x2 <= r) || // Right edge touching
                (x1 < l && x2 > r)      // Surrounded horizontally
            );

        },

        onDragStart : function (event, ui) {

            data = methods.getRootData(this);

            // Hide the element on the tree, pending removal
            $(event.target).hide();
            methods.drawTree(data.root);

            // On the spawned helper, hide the little top line that sticks out
            ui.helper.find('> .tree-node-top').css('height', '0px');

            ui.helper.find('.ui-droppable').droppable('disable');

            // Dropped state lets us know if the object was moved or simply let go of
            ui.helper.data('dropped', false);

        },

        onDragStop : function (event, ui) {

            data = methods.getRootData(this);

            // Reset dropzone placement variables
            data.targetList = null;
            console.log('drag stop', data.targetList);
            data.dropIndex = -1;

            // Decide whether the node should be returned to its home (did it hit a drop zone?)
            if (!ui.helper.data('dropped')) {
                $(event.target).show();
            } else {
                $(event.target).remove();
            }

            methods.drawTree(data.root);

        },

        onDrag : function (event, ui) {

            data = methods.getRootData(this);
            dropIndex = data.dropIndex;

            // If the object is currently on a drop zone
            if (data.targetList) {

                // Get the position of the helper
                var currentOffset = ui.helper.find('> .tree-node').offset().left + (data.nodeWidth / 2);

                // Calculate where the drop zone indicator should be positioned
                var newIndex;

                // For each node in the drop zone, compare its position with the position of the helper
                var nodesInList = $(data.targetList).find('> li:not(.tree-drop-zone)');
                
                if (nodesInList.length) {

                    nodesInList.each(function (index) {

                        var compareOffset = $(this).find('> .tree-node').offset().left + (data.nodeWidth / 2);

                        // If the node is to the right of the helper, we found it
                        if (compareOffset > currentOffset) {
                            /*if (currentOffset < compareOffset + $(this).outerWidth()) {
                                console.log(currentOffset, compareOffset, $(this), $(this).outerWidth());
                                newIndex = -1;
                                data.targetList = $(this).find('ul').first();
                                return false;
                            } else {
                                *///console.log('do we EVER get here?');
                                newIndex = index;
                                return false;
                            /*}*/
                        }

                        // If we reached the end of the list, the helper must be at the right edge
                        if (index == nodesInList.length - 1) {
                            newIndex = index + 1;
                        }

                    });

                } else {

                    // If there are no child elements, just place the indicator at position zero
                    newIndex = 0;

                }

                // If the new drop zone indicator is not in the same position as the previous one, redraw
                if (newIndex != dropIndex) {

                    dropIndex = newIndex;
                    $('.tree-drop-zone').remove();

                    if ($(data.targetList).find('> li').length) {

                        if ($(data.targetList).find('> li')[dropIndex]) {
                            $('<li class="tree-drop-zone"><div class="tree-node"></div></li>').insertBefore($(data.targetList).find('> li')[dropIndex]);
                        } else {
                            $('<li class="tree-drop-zone"><div class="tree-node"></div></li>').insertAfter($(data.targetList).find('> li')[dropIndex-1]);
                        }

                    } else {
                        $('<li class="tree-drop-zone"><div class="tree-node"></div></li>').appendTo($(data.targetList));
                    }

                    methods.drawTree(data.root);

                }
            }

        },

        onOver : function (event, ui) {

            console.log('something over', event, ui);
            data = methods.getRootData(this);
            data.targetList = event.target;
            console.log('over', data.targetList);

        },

        onOut : function (event, ui) {

            data = methods.getRootData(this);

            // Remove the drop zone indicator
            $(event.target).find('.tree-drop-zone').remove();
            methods.drawTree(data.root);

            // Reset drop zone placement variables
            data.targetList = null;
            console.log('out', data.targetList);
            data.dropIndex = -1;

        },

        onDrop : function (event, ui) {

            data = methods.getRootData(this);

            // Add a clone of the helper to the correct place in the tree
            ui.helper.clone().attr('style', '').removeClass().insertBefore($(event.target).find('.tree-drop-zone'));

            // Remove the drop zone indicator
            $(event.target).find('.tree-drop-zone').remove();
            methods.drawTree(data.root);

            // Indicate that the node was dropped on a zone and should not be returned
            ui.helper.data('dropped', true);

        },

        onDeactivate : function (event, ui) {

        }

    };

    $.fn.tree = function (method) {

        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.tree');
        }

    }

})(jQuery);