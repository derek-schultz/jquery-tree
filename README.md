jquery-tree
===========

jQuery plugin that creates a drag and drop tree from a `<ul>` or `<li>` element.

[View a demo](http://derekcomputer.com/projects/jquery-tree/index.html)

Usage
-----

```
$(document).ready(function () {
    $('ul').tree({'title': 'Sitemap'});
});
```

Warnings
--------

This plugin was written in 2012 and hasn't since been updated. It is very pre-beta and not necessarily well tested. It requires a modified version of jQuery UI (included) and is definitely lacking in options. CSS needs to be separated into core and theme files.
