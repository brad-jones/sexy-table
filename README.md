SexyTable
================================================================================
__A good looking HTML5 table that's not a table :)__

This project is a concept that I will be using in an up coming commercial
project that I am involved with. I was looking for a client side component like:

- https://www.datatables.net/
- http://www.jtable.org/
- http://www.dynatable.com/

I wanted a table that was sortable, filterable, searchable and pageable.
I also had a design to follow that called for various fancy drop shadows,
animations and other CSS3 goodies that can not easily be applied to a
traditional HTML ```<table>```.

Dynatable was closest to meeting my requirements.
See: http://www.dynatable.com/#rendering

However I was already using a client side view framework, Transparency.js
And I felt that there was a lot of double up between Dynatable and Transparency.
See: http://leonidas.github.io/transparency/

So What Is SexyTable:
--------------------------------------------------------------------------------
It is a table like client side component, built with HTML, CSS & JS.

> In actual fact this could be refactored using the new Web Components APIs.
> However I required IE8+ compatibility and figured Web Components was just too
> new for my commercial project.
> See: http://webcomponents.org/

```html
<div class="sexy-table">
    <ul>
        <li>Row 1 : Cell 1</li>
        <li>Row 1 : Cell 2</li>
        <li>Row 1 : Cell 3</li>
    </ul>
    <ul>
        <li>Row 2 : Cell 1</li>
        <li>Row 2 : Cell 2</li>
        <li>Row 2 : Cell 3</li>
    </ul>
</div>
```

At it's simplest a _UL_ element represents a _ROW_ of the table
and an _LI_ element represents a _CELL_ of that _ROW_.

The advantage is that each _CELL_ is now a block element that we have greater
control over with CSS. But because of this we lose the normal built in table
sizing functionality thus we use some javascript to explicitly set the height
of each row and the width of each cell.

The other features, sorting, searching, filtering and data binding are all
built on top of this concept. Please see the [examples](/examples) folder
for more info.

--------------------------------------------------------------------------------
Developed by Brad Jones - brad@bjc.id.au
