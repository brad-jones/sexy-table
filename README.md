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

Installation:
--------------------------------------------------------------------------------
__BOWER:__

    bower install sexy-table --save

__NPM:__

    npm install sexy-table --save

__THEN:__
```html
<link rel="stylesheet" href="./dist/SexyTable.css" />
<script src="./dist/SexyTable.js"></script>
```

> NOTE: TypeScript users may also reference the SexyTable.d.ts definitions file.
>
> __OR__
>
> Make use of the _"tsd link"_ feature.
> see: https://github.com/Definitelytyped/tsd#link-to-bundled-definitions

Dependencies:
--------------------------------------------------------------------------------
To make use of all of SexyTable's great features there are a number of other
third party dependencies. Instead of bundling these with SexyTable and forcing
you to include large amounts of potentially unused javascript in your
application.

_It is up to you to include the packages as you need them:_

- All our examples use http://necolas.github.io/normalize.css/
  Results may vary with other CSS Reset solutions.

- To support IE8, you must include https://github.com/brad-jones/lt-ie-9
  or similar.

- Sortable Tables require http://fortawesome.github.io/Font-Awesome/
  Or other CSS rules to set the icons.

- Searchable and Filterable tables require http://lunrjs.com/

- Data Bound Tables make use of http://leonidas.github.io/transparency/
  however similar view frameworks could be used easily enough.

- Editable Tables require Mousetrap https://craig.is/killing/mice.

__At a minimum you must include jQuery before SexyTable!__

> NOTE: All the examples show you exactly what is required.

Building:
--------------------------------------------------------------------------------
If you wish to build SexyTable from the TypeScript/Less sources:

- Install Gulp http://gulpjs.com/

- Install Tsd http://definitelytyped.org/tsd/

- (Optional) Install & Setup your Fav Typescript IDE.  
  Highly recommend: https://atom.io/packages/atom-typescript

- ```git clone git@github.com:brad-jones/sexy-table.git```

- ```cd ./sexy-table```

- ```npm install```

- ```gulp watch```

- Edit the sources as you see fit. Gulp will watch for changes and compile
  automatically for you.

I Confess:
--------------------------------------------------------------------------------
The table has no pre built sexy looking themes. In fact I have purposefully
left the styling as basic as possible so that it can easily be overwritten.

_In short get YOUR graphic designer to make it look sexy :)_

--------------------------------------------------------------------------------
Developed by Brad Jones - brad@bjc.id.au
