////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    /**
     * If set to true we will search for all sexy tables at dom ready and run
     * the automatic width calculations. And then we will show the table.
     */
    SexyTable.AutoMakeSexy = true;
    /**
     * Make sure jQuery is loaded, while SexyTable does not provide a jQuery
     * plugin (yet). It does use jQuery extensively throughout.
     */
    if (typeof jQuery == 'undefined') {
        throw new Error('SexyTable requires jQuery, see: http://jquery.com/');
    }
    /**
     * Finds All Sexy Tables in the DOM and Initialises Them.
     */
    $(document).ready(function () {
        if (SexyTable.AutoMakeSexy) {
            $('.sexy-table').each(function (index, table) {
                new SexyTable.Table(table);
            });
        }
    });
})(SexyTable || (SexyTable = {}));
////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    /**
     * Allows the cells of the table to be edited.
     *
     * > NOTE: This is not meant to provide anything like the functionality of
     * > an Excel spreadsheet or similar, if that is what you are looking for
     * > see projects like:
     * >
     * >    - http://handsontable.com/
     * >    - http://wijmo.com/products/spreadjs/
     */
    var Editor = (function () {
        /**
         * Editor Constructor
         */
        function Editor(table) {
            this.table = table;
            /**
             * An array of callbacks, that will be run upon a cell being edited.
             */
            this.onEditCallBacks = new Array();
            /**
             * The number of milliseconds to wait before calling the OnSave method.
             */
            this.deBounceWait = 250;
            this.container = this.table.GetContainer();
            this.mirror = $('<span />');
            this.mirror.css({
                'position': 'absolute',
                'top': '-999px',
                'left': '0px',
                'white-space': 'pre'
            });
            $("body").append(this.mirror);
            this.InsertEditFields();
        }
        /**
         * Registers an OnEdit Callback.
         *
         * > NOTE: To be clear this is called after the cell
         * > has been edited and saved.
         */
        Editor.prototype.OnEdit = function (callBack) {
            this.onEditCallBacks.push(callBack);
        };
        /**
         * Inserts an Input Text Box into each Cell.
         */
        Editor.prototype.InsertEditFields = function () {
            // Scope hack.
            var that = this;
            // Loop through each cell in the table.
            this.table.GetCells().each(function (cellNo, cell) {
                // Bail out if we can't edit this cell
                if (!that.IsCellEditable(cell))
                    return;
                // Bail out if the cell already has an input field
                if ($(cell).find('input').length > 0)
                    return;
                // Grab the inner
                var inner = $(cell).find('.inner');
                // Grab the contents of the cell
                var data = inner.text();
                // Create a new input field
                var input = $('<input />');
                input.attr('type', 'text');
                input.val(data);
                // Create the save callback
                var save = that.OnSave.bind(that, inner);
                // Bind some keyboard shortcuts to the save handler
                //
                // > NOTE: I am debating if we really need this,
                // > now that we save on keyup...
                Mousetrap(input[0]).bind(['enter', 'mod+s'], save);
                // On keyup call the save handler
                input.keyup(save);
                // Replace the contents of the cell with our new input field
                inner.empty().append(input);
            });
        };
        /**
         * This is called after a table been ReDrawn.
         *
         * > NOTE: We do not need to worry about the Mousetrap events,
         * > these appear to continue to work.
         */
        Editor.prototype.ReAttachEventHandlers = function () {
            this.table.GetCells().parents('.tbody').find('input').each((function (inputNo, input) {
                $(input).keyup(this.OnSave.bind(this, $(input).parents('.inner')));
            }).bind(this));
        };
        /**
         * Not all cells in the table should be editable.
         * Given a cell this will tell us if we are allowed to edit it or not.
         */
        Editor.prototype.IsCellEditable = function (cell) {
            // Editing column headings seems like a dangerous thing.
            if ($(cell).parents('.thead').length > 0)
                return false;
            // Can't edit cells that have explicitly been set not be editable.
            if ($(cell).data('no-edit') === true)
                return false;
            // Can't edit cells without a column heading
            var inner = $(cell).find('.inner');
            var heading = this.table.GetReader().GetHeading(inner);
            if (typeof heading === 'undefined')
                return false;
            if (heading === '')
                return false;
            // If we get to here we assume the cell is editable.
            return true;
        };
        /**
         * This will grab the contents of the input field
         * and update the table.
         *
         * > NOTE: This does not send any data back to the server!
         * > You must do this yourself with the Reader.
         */
        Editor.prototype.OnSave = function (cell) {
            // Setup the debounce
            clearTimeout(this.deBounceTimeout);
            this.deBounceTimeout = setTimeout((function () {
                // To help the Sizer we will loop through all our inputs and
                // update their widths accordingly. Otherwise the table size
                // will not change because the input are set 100% width.
                this.table.GetCells().parents('.tbody').find('input').each(this.SetWidthOfInput.bind(this));
                // Refresh the table
                if (this.table.HasSearcher()) {
                    // If the table has a searcher, this includes filterable
                    // tables. We need to update the search index in a smart
                    // way. We can not simply call the Refresh method as it may
                    // re-serialize the table in a "searched" or "filtered"
                    // state which would remove rows from the table.
                    this.table.GetSizer().ForceResize();
                    this.table.GetReader().UpdateOriginal(cell);
                    this.table.GetSearcher().BuildIndexes();
                }
                else {
                    this.table.Refresh();
                }
                // Ensure all the inputs have the same width in the same column.
                this.table.GetColumns().forEach(function (col) {
                    var maxWidth = -1;
                    col.forEach(function (cell) {
                        var width = $(cell).find('input').width();
                        if (width > maxWidth)
                            maxWidth = width;
                    });
                    col.forEach(function (cell) {
                        $(cell).find('input').width(maxWidth);
                    });
                });
                // Grab the new edited data
                var data = cell.find('input').val();
                // Grab the column heading
                var col = this.table.GetReader().GetHeading(cell);
                // Grab the row number or id of the row if it has one.
                var row;
                if (cell.parents('ul[id]').length == 1) {
                    // The assumption is that this ID will reflect the same ID
                    // used on the server in the database. This is how I setup
                    // my transparency directives anyway.
                    row = parseInt(cell.parents('ul[id]').attr('id'));
                }
                else {
                    // This will be a 0 based number of the row
                    row = this.container.find('.tbody').find('ul').index(cell.parents('ul'));
                }
                // Run any OnEdit callbacks
                this.onEditCallBacks.forEach(function (callback) {
                    callback(row, col, data, cell);
                });
            }).bind(this), this.deBounceWait);
            // Remember that we are tied to the ctrl+s keyboard shortcut.
            // So we return false to prevent the browser form performing
            // it's default action.
            return false;
        };
        /**
         * Updates the given inputs width to reflect it's content.
         *
         * @credit https://github.com/MartinF/jQuery.Autosize.Input
         */
        Editor.prototype.SetWidthOfInput = function (index, input) {
            // Copy the "font" styles from the input to the mirror.
            //
            // > NOTE: We do need to do this everytime because it is possible
            // > some fields could have different styles.
            $.each([
                'fontFamily', 'fontSize', 'fontWeight',
                'fontStyle', 'letterSpacing', 'textTransform',
                'wordSpacing', 'textIndent'
            ], (function (key, val) {
                this.mirror[0].style[val] = $(input).css(val);
            }).bind(this));
            // Copy the text from the input into mirror
            this.mirror.text($(input).val());
            // Grab the widths of the mirror and the input
            var inputWidth = $(input).width();
            var mirrorWidth = this.mirror.width();
            // Only update the width of the input if it's
            // contents is larger than it's current width.
            if (inputWidth < mirrorWidth) {
                // Usual deal, IE needs some extra padding.
                mirrorWidth = mirrorWidth + 5;
                $(input).width(mirrorWidth);
            }
        };
        return Editor;
    })();
    SexyTable.Editor = Editor;
})(SexyTable || (SexyTable = {}));
////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    /**
     * Adds filter controls for each column of the table.
     */
    var Filterer = (function () {
        /**
         * Give us the tables top level container element.
         * And we will add some sort controls to the tables first row.
         */
        function Filterer(table) {
            this.table = table;
            this.container = this.table.GetContainer();
            this.EnsureTableHasThead();
            this.InsertFilterInputs();
        }
        Filterer.prototype.ResetFilters = function () {
            this.container.find('.thead input').val('');
        };
        /**
         * Filterable tables rely on the thead and tbody containers!
         */
        Filterer.prototype.EnsureTableHasThead = function () {
            if (this.container.find('.thead, .tbody').length != 2) {
                throw new Error('Sortable tables MUST use .thead and .tbody containers!');
            }
        };
        /**
         * This will add a second row to the thead container.
         * The row will house a text box per column.
         */
        Filterer.prototype.InsertFilterInputs = function () {
            var headings = this.table.GetReader().GetHeadings();
            var filters = $('<ul></ul>');
            for (var i = 0; i < headings.length; i++) {
                var cell = $('<li><div class="inner"></div></li>');
                if (headings[i] != "") {
                    var filter = $('<input name="' + headings[i] + '" type="text" placeholder="All" />');
                    filter.keyup(this.OnFilter.bind(this, filter));
                    cell.find('.inner').append(filter);
                }
                filters.append(cell);
            }
            this.container.find('.thead').append(filters);
        };
        /**
         * Callback for each filters keyup event.
         */
        Filterer.prototype.OnFilter = function (filter) {
            // For now multi column filtering is not supported.
            this.container.find('.thead input').not(filter).val('');
            this.table.GetSearcher().Query($(filter).val(), $(filter).attr('name'));
        };
        return Filterer;
    })();
    SexyTable.Filterer = Filterer;
})(SexyTable || (SexyTable = {}));
////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    /**
     * Ties a SexyTable to a Server Backend.
     */
    var Pager = (function () {
        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        function Pager(table, nextCb) {
            this.table = table;
            this.nextCb = nextCb;
            /**
             * If the pager loads the first page this will get set to true.
             * So that we can do table initialisation stuff.
             */
            this.FirstPage = false;
            /**
             * A row counter used so the server knows the number of records to skip.
             */
            this.rows = 0;
            /**
             * A flag to donote when we have reached the end of a result set.
             */
            this.atEnd = false;
            this.container = this.table.GetContainer();
            // Lets check to see if the table has any data at all.
            // Sometimes we may include some seed data for the table with the
            // intial page request, other times we may prefer the pager to load
            // the first data set.
            if (this.container.find('.tbody').is(':empty')) {
                this.FirstPage = true;
                this.GetNext();
            }
            $(window).scroll(this.OnScroll.bind(this));
        }
        /**
         * Our tables are sexy, we do not use old fashioned clunky next and
         * back buttons. We attach ourselves to the windows on scroll event.
         * Once we detect the user has reachedf the end of the page we will
         * attempt to load more rows into the table.
         *
         * > NOTE: Fancy animations and other loading effects are not provided.
         * > It is up to you to do this in the Pagers nextCb.
         *
         * > TODO: Cater for situations where the table is inside a scrollable
         * > div, instead of the entire window.
         */
        Pager.prototype.OnScroll = function () {
            // Bail out if there are no more results to load.
            if (this.atEnd)
                return;
            var docHeight = $(document).height();
            var windowHeight = $(window).height();
            var scrollTop = $(window).scrollTop();
            if (scrollTop + windowHeight == docHeight) {
                this.rows = this.container.find('.tbody ul').length;
                this.GetNext();
            }
        };
        /**
         * If the table is sortable this will fire when a new sort is performed.
         */
        Pager.prototype.OnSort = function (column, direction) {
            this.rows = 0;
            this.atEnd = false;
            this.sort = { 'column': column, 'direction': direction };
            this.GetNext();
        };
        /**
         * If the table is searchable / filterable this will fire
         * when a new search is performed.
         */
        Pager.prototype.OnSearch = function (column, terms) {
            this.rows = 0;
            this.atEnd = false;
            this.search = { 'column': column, 'terms': terms };
            this.GetNext();
        };
        /**
         * Sets up and calls the Next Callback.
         */
        Pager.prototype.GetNext = function () {
            this.nextCb(this.rows, this.sort, this.search, this.OnResponse.bind(this));
        };
        /**
         * Runs when the nextCb calls us, normally after the success of an
         * AJAX request. The response Object is expected to match up with
         * the transparency data bind template.
         */
        Pager.prototype.OnResponse = function (response) {
            if (response == null) {
                // We have no more records to load
                this.atEnd = true;
                return;
            }
            if (this.rows == 0) {
                this.table.GetWriter().Replace(response);
            }
            else {
                this.table.GetWriter().Append(response);
            }
            if (this.FirstPage) {
                try {
                    this.table.GetSorter().UseServer(this.OnSort.bind(this));
                }
                catch (e) { }
                try {
                    this.table.GetSearcher().UseServer(this.OnSearch.bind(this));
                }
                catch (e) { }
                this.FirstPage = false;
            }
        };
        return Pager;
    })();
    SexyTable.Pager = Pager;
})(SexyTable || (SexyTable = {}));
////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    var Reader = (function () {
        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        function Reader(table) {
            this.table = table;
            this.container = this.table.GetContainer();
            this.original = this.Serialize().slice(0);
        }
        Reader.prototype.GetHeadings = function () {
            return this.headings;
        };
        Reader.prototype.GetSerialized = function () {
            return this.serialized;
        };
        Reader.prototype.GetOriginal = function () {
            return this.original;
        };
        /**
         * Serialize's the DOM into a JSON Like Object.
         *
         * > NOTE: Instead of calling this method everytime you may call this
         * > once. And then call GetSerialized() which will in effect cache the
         * > results for you.
         */
        Reader.prototype.Serialize = function (updateOriginal) {
            if (updateOriginal === void 0) { updateOriginal = false; }
            this.serialized = [];
            this.headings = this.ExtractHeadings();
            if (this.container.find('.tbody').length == 0) {
                this.container.find('ul').each(this.AddRow.bind(this));
            }
            else {
                this.container.find('.tbody ul').each(this.AddRow.bind(this));
            }
            if (updateOriginal)
                this.original = this.serialized.slice(0);
            return this.serialized;
        };
        /**
         * Returns a JSON string representation of the table ready to be sent
         * via AJAX. Basically this removes the _dom and _guid properties.
         */
        Reader.prototype.ToJson = function (cache) {
            if (cache === void 0) { cache = true; }
            var data, jsonArray = [];
            if (cache) {
                data = this.serialized;
            }
            else {
                data = this.Serialize();
            }
            for (var i = 0; i < data.length; i++) {
                var row = {};
                for (var key in data[i]) {
                    if (key != '_dom' && key != '_guid') {
                        row[key] = data[i][key];
                    }
                }
                jsonArray.push(row);
            }
            return JSON.stringify(jsonArray);
        };
        /**
         * If the table uses a thead container we will extract the actual
         * column heading names. If not we just create some generic column
         * headings.
         */
        Reader.prototype.ExtractHeadings = function () {
            var headings = [];
            if (this.container.find('.thead').length == 0) {
                // We have no thead so lets just use numeric headings
                var cols = this.container.find('ul').first().find('li').length;
                for (var i = 0; i < cols; i++)
                    headings.push("col_" + i);
            }
            else if (this.table.HasWriter()) {
                // The table has a data binding template so lets
                // use the data-bind values as our heading names.
                this.container.find('.data-bind-template ul').first().find('li')
                    .each(function (index, el) {
                    var heading = $(el).data('bind');
                    if (heading === undefined)
                        heading = "";
                    headings.push(heading);
                });
            }
            else {
                // We do have a thead so lets extract the column headings
                this.container.find('.thead ul').first().find('li').each(function (index, cell) {
                    headings.push($(cell).find('.inner').text()
                        .toLowerCase().replace(" ", "_"));
                });
            }
            return headings;
        };
        /**
         * Creates the Object that represents a Table Row
         * and adds it the Serialized Array.
         */
        Reader.prototype.AddRow = function (rowNo, row) {
            var rowData = {}, that = this;
            // Create a GUID for our row. This is used by the Searcher.
            // And is a way to uniquely identify a row without using DOM ID's.
            rowData['_guid'] = this.CreateGuid();
            // Add a reference to the dom. This will be useful
            // when sorting and other dom manipulations.
            rowData['_dom'] = row;
            $(row).find('li').each(function (cellNo, cell) {
                // Ignore columns with no heading as these can't hold
                // data. These will normally be columns with other UI
                // elements such as buttons.
                if (that.headings[cellNo] != "") {
                    if ($(cell).find('input').length === 1) {
                        rowData[that.headings[cellNo]] = $(cell).find('input').val();
                    }
                    else {
                        rowData[that.headings[cellNo]] = $(cell).find('.inner').text();
                    }
                }
            });
            this.serialized.push(rowData);
        };
        /**
         * Creates a GUID.
         *
         * @see http://goo.gl/8XDeuU
         */
        Reader.prototype.CreateGuid = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        /**
         * Given a particular cell from the table,
         * we will update the serialized state.
         */
        Reader.prototype.UpdateOriginal = function (cell) {
            var parent = cell.parents('ul');
            for (var i = 0; i < this.original.length; i++) {
                var row = this.original[i];
                if (row['_dom'] === parent[0]) {
                    var colNo = parent.find('.inner').index(cell);
                    var colHeading = this.headings[colNo];
                    if (cell.find('input').length === 1) {
                        row[colHeading] = cell.find('input').val();
                    }
                    else {
                        row[colHeading] = cell.text();
                    }
                    break;
                }
            }
        };
        /**
         * Given a cell of the table, this will return the column heading.
         */
        Reader.prototype.GetHeading = function (cell) {
            return this.headings[cell.parents('ul').find('.inner').index(cell)];
        };
        return Reader;
    })();
    SexyTable.Reader = Reader;
})(SexyTable || (SexyTable = {}));
////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    var Searcher = (function () {
        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        function Searcher(table) {
            this.table = table;
            this.container = this.table.GetContainer();
            this.EnsureTableHasThead();
            this.BuildIndexes();
        }
        /**
         * Searchable tables rely on the thead and tbody containers!
         */
        Searcher.prototype.EnsureTableHasThead = function () {
            if (this.container.find('.thead, .tbody').length != 2) {
                throw new Error('Searchable tables MUST use .thead and .tbody containers!');
            }
        };
        /**
         * Tells us to redirect all search requests to your callback.
         * Lunr.js is no longer used for searching. See the "Pager" for more
         * details about working with a server backend.
         *
         * > TODO: When the Searcher is told to use a searcher backend
         * > it still requires Lunr.js to be loaded. Need to move the dependancy
         * > check to somewhere later on in the pipeline.
         *
         * > NOTE: I have had ideas about some sort of hybrid client side and
         * > server side searching solution, where the lunr search would be
         * > used as a cache of sorts but I haven't had a chance to develop my
         * > thoughts any further.
         */
        Searcher.prototype.UseServer = function (serverCb) {
            this.serverCb = serverCb;
        };
        /**
         * Using Lunr.js we search the Table for the supplied Terms.
         *
         * If the column is set to "all" we search all columns.
         * Otherwise this needs to be the snake case name of the column.
         * ie: first_name or col_1 depending on how the table is serialized.
         *
         * To reset the table supply a null or empty search term.
         */
        Searcher.prototype.Query = function (terms, column) {
            if (column === void 0) { column = 'all'; }
            // Reset table if no terms supplied
            if (terms == null || terms == "") {
                this.table.Reset();
                return;
            }
            // If we have a server callback let's use it instead.
            if (this.serverCb != null) {
                this.serverCb(column, terms);
                return;
            }
            // Lets grab some results from Lunr
            var results = new Array();
            if (column == 'all') {
                results = this.index.search(terms);
            }
            else {
                results = this.perColIndexes[column].search(terms);
            }
            // Collect the rows that match our results from lunr
            var matches = new Array();
            var original = this.table.GetReader().GetOriginal();
            for (var result in results) {
                for (var row in original) {
                    if (results[result].ref == original[row]['_guid']) {
                        matches.push(original[row]);
                    }
                }
            }
            // The results returned from Lunr will be sorted by their relevance
            // scores however if the table is sortable & "SORTED" we will
            // maintain the current sort state.
            if (this.table.HasSorter()) {
                this.table.GetSorter().Sort(matches);
            }
            // Redraw the table
            this.table.Redraw(matches, true, true);
        };
        /**
         * Build the indexes of the table.
         *
         *   - We use one for global searches across the entire table.
         *   - We then create an index for each column of the table.
         *
         * > NOTE: We were using this solution: https://goo.gl/1Ao45P
         * > I found this unsatisfactory and have now setup an independent lunr
         * > index for each column of the table.
         */
        Searcher.prototype.BuildIndexes = function () {
            // Bail out if we have been told to use a server for all searching.
            if (this.serverCb != null)
                return;
            // Grab the table data
            var data = this.table.GetReader().GetOriginal();
            // Build the global index
            this.index = this.BuildIndexSchema();
            for (var row in data) {
                var document = {};
                for (var column in data[row]) {
                    if (column == '_guid') {
                        document['_guid'] = data[row]['_guid'];
                    }
                    else if (column != '_dom') {
                        document[column + 'Exact'] = data[row][column];
                        document[column] = this.PrepareIndexValue(data[row][column]);
                    }
                }
                this.index.add(document);
            }
            // Now build an index for each column of the table
            this.perColIndexes = {};
            for (var row in data) {
                for (var column in data[row]) {
                    if (column != '_guid' && column != '_dom') {
                        if (!this.perColIndexes.hasOwnProperty(column)) {
                            this.perColIndexes[column] = lunr(function () {
                                this.ref('_guid');
                                this.field('colValueExact', { boost: 10 });
                                this.field('colValue');
                            });
                        }
                        this.perColIndexes[column].add({
                            '_guid': data[row]['_guid'],
                            'colValueExact': data[row][column],
                            'colValue': this.PrepareIndexValue(data[row][column])
                        });
                    }
                }
            }
        };
        /**
         * Builds the Lunr Index Schema for the global index.
         */
        Searcher.prototype.BuildIndexSchema = function () {
            var headings = this.table.GetReader().GetHeadings();
            return lunr(function () {
                this.ref('_guid');
                for (var i = 0; i < headings.length; i++) {
                    if (headings[i] != '_guid' && headings[i] != '_dom') {
                        this.field(headings[i] + 'Exact', { boost: 10 });
                        this.field(headings[i]);
                    }
                }
            });
        };
        /**
         * Given a cell value, we prepare it to be inserted into the lunr index.
         *
         * Lunr does a pretty damn good job of indexing paragraphs of text.
         * Where it fails is indexing single items such as a timestamp.
         * Lunr sees the timestamp as a single word and as such you can not
         * search on the diffrent parts (day, month, year) of the date.
         *
         * By removing all special characters, used for formatting and replacing
         * them with spaces, lunr now tokenizes the timestamp, allowing the user
         * to seach by year for example.
         *
         * This same principal applies to things like hyphenated words, a user
         * may not always type the hypens in their search query because they are
         * lazy.
         *
         * However we still need to cater for the case that an exact search term
         * is given thus we index both the unmodified cell value as well as this
         * prepared version.
         *
         * The Exact field get a boost value applied.
         */
        Searcher.prototype.PrepareIndexValue = function (value) {
            return value.trim().replace(/[^\w\s]/gi, ' ');
        };
        return Searcher;
    })();
    SexyTable.Searcher = Searcher;
})(SexyTable || (SexyTable = {}));
////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    /**
     * This is what emulates the auto sizing features of a normal HTML <table>.
     */
    var Sizer = (function () {
        /**
         * Give us the tables top level container element.
         * And we will ensure it's rows & cells are sized correctly.
         */
        function Sizer(table) {
            this.table = table;
            this.container = this.table.GetContainer();
            this.ForceResize();
            this.UnhideContainer();
            $(window).resize(this.ForceResize.bind(this));
        }
        /**
         * When a table is updated with new data we will need to make sure it's
         * sized correctly. This is used by the Writer and may be used directly
         * at anytime if required.
         */
        Sizer.prototype.ForceResize = function () {
            this.container.width('100%');
            this.table.GetCells().removeData('dont-resize');
            this.table.GetCells().css('width', 'auto');
            this.table.GetRows().css('height', 'auto');
            this.SetWidthOfColumns();
            this.SetHeightOfRows();
            this.IncreaseLastColumn();
            this.CheckForOverFlownRows(this.table.GetColumns());
        };
        /**
         * Sets the width of each of the columns in the table.
         *
         * This turned out to be much more complex that I first thought.
         * I'm sure this method is not as efficent as it could be but for
         * now it works.
         */
        Sizer.prototype.SetWidthOfColumns = function () {
            // Get all our cells grouped by columns
            var columns = this.table.GetColumns();
            // Grab the natural width of each column
            var colWidths = [];
            columns.forEach(function (col) {
                var maxWidth = -1;
                col.forEach(function (cell) {
                    // Ignore filters
                    if ($(cell).find('input').length == 1) {
                        if ($(cell).parents('.thead').length == 1) {
                            return;
                        }
                    }
                    var cellWidth = $(cell).outerWidth(true);
                    if (cellWidth > maxWidth) {
                        maxWidth = cellWidth;
                    }
                }, this);
                colWidths.push(maxWidth);
            }, this);
            // Sum up the widths
            var totalWidth = colWidths.reduce(function (a, b) { return a + b; }, 0);
            // Now convert the column widths into percentages
            columns.forEach(function (col, colNo) {
                var width = (colWidths[colNo] / totalWidth * 100) + '%';
                col.forEach(function (cell) { $(cell).css('width', width); });
            });
            // At this point the columns are sized with the correct ratios.
            // However we can obviously run into the issue where a cell
            // overflows. In this case we need to increase the width of the
            // column that the overflown cell belongs to but then remove the
            // width from other columns. This calculates the amount of width
            // that needs to be removed from the table.
            var remove = 0;
            this.table.GetColumns().forEach(function (col, colNo) {
                // Get all the inner widths of each cell in the column.
                var widths = this.GetColWidths(col);
                // Add the diff to the total amount we need to remove.
                remove = remove + widths.diff;
                // Set the width of each cell in the column to the maximum.
                // This lines up the cells in the column and converts the
                // percentage width into a pixel value. From this point forward
                // we work with pixels.
                col.forEach(function (cell) {
                    $(cell).css('width', widths.max);
                });
            }, this);
            // Account for any left and right padding of the rows
            remove = remove + this.GetRowPadding();
            // Now we need to adjust the size of the columns in the table so
            // everything fits. This is a recursive process until we have no
            // more columns to resize.
            this.ReDistributeWidth(remove, columns);
        };
        /**
         * Given an amount of width to remove and a set of columns to remove it
         * from. This will resize the columns in the table so that everything
         * fits.
         */
        Sizer.prototype.ReDistributeWidth = function (remove, columns) {
            // The amount of width we need to remove from each column.
            var removePerCol = remove / this.GetResizeableCols();
            // In some cases we may reach the minimum size of a cell / column.
            // This is a taly of the number of pixels we failed to remove.
            var failedToRemove = 0;
            // Loop through the columns
            for (var colNo = 0; colNo < columns.length; colNo++) {
                var column = columns[colNo];
                // We can't resize this column, so skip it.
                if ($(column[0]).data('dont-resize') === true)
                    continue;
                // Grab the current column width
                var currentColumnWidth = this.GetColumnWidth(column);
                // Calculate the new width of the column that we are aiming for.
                // NOTE: This is the width we WANT but may NOT get.
                var idealColumnWidth = currentColumnWidth - removePerCol;
                // If the total amount to remove is less than 1 then we only
                // need to remove 1 pixel from one column. Removing less than 1
                // pixel doesn't really work - no such thing as half a pixel.
                if (remove <= 1) {
                    idealColumnWidth = currentColumnWidth - 1;
                }
                // This will be the minimum width of the column,
                // if we reach it's minimum width that is.
                var columnMinimumWidth = -1;
                // Loop through each cell in the column and attempt to resize it
                for (var cellNo = 0; cellNo < column.length; cellNo++) {
                    var cell = column[cellNo];
                    // Set the new width of the cell
                    $(cell).css('width', idealColumnWidth);
                    // Check if the cell has overflown.
                    var innerWidth = $(cell).find('.inner').outerWidth(true);
                    if (innerWidth > idealColumnWidth) {
                        // This cell has reached it's minimum size.
                        $(cell).css('width', innerWidth);
                        // Only update the column minimum width
                        // if it's larger than the previous value.
                        if (innerWidth > columnMinimumWidth) {
                            columnMinimumWidth = innerWidth;
                        }
                    }
                }
                // Set the new column width, this lines up the cells again.
                var newColumnWidth = this.GetColumnWidth(column);
                for (var cellNo = 0; cellNo < column.length; cellNo++) {
                    $(column[cellNo]).css('width', newColumnWidth);
                }
                // Once a column has reached it's minimum size,
                // ensure we do not attempt to resize it again.
                if (columnMinimumWidth > 0) {
                    $(column[0]).data('dont-resize', true);
                    // The total amount to remove was less than 1px but we
                    // failed to remove it from this column. As there are more
                    // columns left that are resizeable we don't want to add
                    // the 1px to the failedToRemove tally.
                    if (remove <= 1 && this.GetResizeableCols() > 0) {
                        continue;
                    }
                    // It also means that we were unable
                    // to remove some width from the table.
                    failedToRemove = failedToRemove +
                        (columnMinimumWidth - idealColumnWidth);
                }
                else {
                    // The total amount to remove was less than 1px and we
                    // successfully managed to remove that one pixel. So we
                    // do not need to loop through rest of the columns.
                    if (remove <= 1) {
                        break;
                    }
                }
            }
            // Do we still have pixels to remove from the table?
            if (failedToRemove > 0) {
                // Do we have have resizeable columns left?
                if (this.GetResizeableCols() > 0) {
                    // We have at least one resizeable column
                    // left so lets run ourselves again.
                    this.ReDistributeWidth(failedToRemove, columns);
                }
                else {
                    // Set the minimum width of the table.
                    // The table will now overflow it's parent
                    // just like a real table would.
                    this.container.css('width', this.GetMinimumTableSize());
                }
            }
        };
        /**
         * Loops through all rows in the table and sets their height.
         */
        Sizer.prototype.SetHeightOfRows = function () {
            var that = this;
            this.table.GetRows().each(function (index, row) {
                $(row).css('height', that.CalculateRowHeight(row));
            });
            // Because the last row in the table also has a bottom border we
            // need to increase it's height by the height of the border.
            var last = this.table.GetRows().last();
            last.css('height', last.outerHeight(true) + this.GetRowBorder());
        };
        /**
         * Given a UL row element this will loop through all it's LI cells
         * and calculate the rows maximum height.
         */
        Sizer.prototype.CalculateRowHeight = function (row) {
            var maxHeight = -1;
            $(row).find('li').each(function (index, cell) {
                if ($(cell).outerHeight(true) > maxHeight) {
                    maxHeight = $(cell).outerHeight(true);
                }
            });
            return maxHeight + this.GetRowBorder();
        };
        /**
         * In some cases we end up with some spare space.
         * Lets fill that spare space.
         */
        Sizer.prototype.IncreaseLastColumn = function () {
            // Scope hack
            var that = this;
            // Loop through each of the rows
            this.table.GetRows().each(function (rowNo, row) {
                // Add up the cell widths
                var total = 0;
                $(row).find('li').each(function (cellNo, cell) {
                    total = total + $(cell).outerWidth(true);
                });
                // By how much is the row short?
                var add = $(row).innerWidth() - total;
                // Inner width includes padding, we don't want padding!
                add = add - that.GetRowPadding();
                // If we have anything to add, lets add it
                if (add > 0) {
                    var last = $(row).find('li').last();
                    last.css('width', last.outerWidth(true) + add);
                }
            });
        };
        /**
         * Even after all our fancy resizing we still end up
         * with overflown rows in some cases rows.
         *
         * This will be due to a number of reasons:
         *
         *   - Rounding Errors, diffrent browsers do this better than others.
         *     Also I believe jQuery plays a role in the rounding of width and
         *     height values.
         *
         *   - Margins, Paddings & Boarders that have not been accounted for.
         *     Over time hopefully we will be able to catch more and more of
         *     these special cases.
         *
         *   - Other maths errors that I may have made...
         *     If you find one help me fix it :)
         *
         * Anyway this method will apply one last resize of the table to ensure
         * everything fits... hopefully :)
         */
        Sizer.prototype.CheckForOverFlownRows = function (columns, recurse) {
            if (recurse === void 0) { recurse = 0; }
            // Because IE is stupid!
            if (recurse > 10)
                return;
            // Scope hack
            var that = this;
            // Assume we havn't resized anything for now
            var resized = false;
            // Loop through each of the rows
            this.table.GetRows().each(function (rowNo, row) {
                // Check if the row has overflown
                if ($(row).prop('scrollHeight') > $(row).outerHeight()) {
                    // Add up the cell widths
                    var total = 0;
                    $(row).find('li').each(function (cellNo, cell) {
                        total = total + $(cell).outerWidth(true);
                    });
                    // By how much has the row overflown?
                    var remove = total - $(row).innerWidth();
                    // Because IE is stupid again!
                    if (remove < 1)
                        remove = that.GetColumnBorder();
                    // Guess what it's time to remove some more width
                    that.ReDistributeWidth(remove, columns);
                    // Now that we have adjusted the column widths
                    // we need to recalculate the rows height.
                    $(row).css('height', 'auto');
                    $(row).css('height', that.CalculateRowHeight(row));
                    // Make sure we check again that we have no rows overflowing
                    resized = true;
                }
            });
            // If we resized something we should recurse again.
            if (resized)
                this.CheckForOverFlownRows(columns, ++recurse);
        };
        /**
         * Calculates the minimum size of the table.
         */
        Sizer.prototype.GetMinimumTableSize = function () {
            var minimum = 0, border = this.GetColumnBorder();
            var row = this.table.GetRows().first();
            row.find('li').each(function (cellNo, cell) {
                minimum = minimum + $(cell).find('.inner').outerWidth(true);
                // Account for border
                minimum = minimum + border;
            });
            // Account for padding applied to the row
            minimum = minimum + this.GetRowPadding();
            // Add the border again for IE
            minimum = minimum + border;
            return minimum;
        };
        /**
         * Counts the number of columns in the table that
         * still have space to spare and can be resized.
         */
        Sizer.prototype.GetResizeableCols = function () {
            var columns = this.table.GetColumns();
            var resizeable_cols = this.GetNumberOfCols();
            for (var i = 0; i < columns.length; i++) {
                if ($(columns[i][0]).data('dont-resize') === true) {
                    --resizeable_cols;
                }
            }
            return resizeable_cols;
        };
        /**
         * Gets the inner widths of all cells in the provided column.
         * Performs some basic calcs on the widths and returns an object
         * for easy access to the results.
         */
        Sizer.prototype.GetColWidths = function (col) {
            var widths = [];
            for (var i = 0; i < col.length; i++) {
                widths.push($(col[i]).find('.inner').outerWidth(true) +
                    this.GetColumnBorder());
            }
            var min = Math.min.apply(null, widths);
            var max = Math.max.apply(null, widths);
            var diff = max - min;
            // We have a column that has a minimum width and has no cells wider
            // than that width. So we need to get the diff between the minimum
            // width and the natural width of the column.
            if (parseInt($(col[0]).css('min-width')) > 0 && diff == 0) {
                // Check if we have the width already calculated
                if (typeof $(col[0]).data('min-width') === 'undefined') {
                    // Save and reset the min width value
                    var tmp = $(col[0]).css('min-width');
                    $(col[0]).css('min-width', '0');
                    // Grab the natual width of the column
                    min = $(col[0]).find('.inner').outerWidth(true) +
                        this.GetColumnBorder();
                    // Save the value for future recursions
                    $(col[0]).data('min-width', min);
                    // Put the min width value back as it was
                    $(col[0]).css('min-width', tmp);
                }
                else {
                    min = $(col[0]).data('min-width');
                }
                // Using the new min value recalculate the diff
                diff = max - min;
            }
            return { widths: widths, min: min, max: max, diff: diff };
        };
        /**
         * Similar to GetColWidths but only returns the columns max width.
         * Doesn't consider the inner either.
         */
        Sizer.prototype.GetColumnWidth = function (col) {
            var widths = [];
            for (var i = 0; i < col.length; i++) {
                widths.push($(col[i]).outerWidth(true));
            }
            return Math.max.apply(null, widths);
        };
        /**
         * To make sure we don't overflow any rows of the table.
         * We need to cater for any borders. This assumes that the
         * same border is applied to all rows of the table.
         */
        Sizer.prototype.GetRowBorder = function () {
            var row = this.container.find('ul').first();
            return row.outerHeight(true) - row.innerHeight();
        };
        /**
         * In some css layouts you may like to add horizontal padding to rows.
         * Creating a frame and inseting the actual table contents.
         * This method calculates that padding if applied.
         *
         * > NOTE: We assume the same padding has been applied to all rows.
         */
        Sizer.prototype.GetRowPadding = function () {
            var row = this.container.find('ul').first();
            return row.outerWidth(true) - row.width();
        };
        /**
         * To make sure we don't overflow any cells of the table.
         * We need to cater for any borders. This assumes that the
         * same border is applied to all cells of the table.
         */
        Sizer.prototype.GetColumnBorder = function () {
            var cell = this.container.find('li').first();
            return cell.outerWidth(true) - cell.innerWidth();
        };
        /**
         * Gets the number of columns in the table.
         *
         * > NOTE: At the this stage the equivalent of colspans are not
         * > supported. The first UL row in the table is assumed to have
         * > the same number of LI cells as the rest of the table.
         */
        Sizer.prototype.GetNumberOfCols = function () {
            return this.table.GetColumns().length;
        };
        /**
         * After all sizing functions have taken place, it's safe to show the
         * table, knowing it won't look like a dogs breakfast, regurgitated.
         */
        Sizer.prototype.UnhideContainer = function () {
            this.container.css('visibility', 'visible');
        };
        return Sizer;
    })();
    SexyTable.Sizer = Sizer;
})(SexyTable || (SexyTable = {}));
////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    /**
     * Adds sorting controls to the first row of the table.
     *
     * > NOTE: We assume font awesome icons are avaliable.
     */
    var Sorter = (function () {
        /**
         * Give us the tables top level container element.
         * And we will add some sort controls to the tables first row.
         */
        function Sorter(table) {
            this.table = table;
            /**
             * Makes the natural sort algorithm ignore case.
             */
            this.caseInsensitive = true;
            this.container = this.table.GetContainer();
            this.EnsureTableHasThead();
            this.InsertSortableToggles();
            this.customSorters = { "*": this.naturalSort };
        }
        /**
         * Sortable tables rely on the thead and tbody containers!
         */
        Sorter.prototype.EnsureTableHasThead = function () {
            if (this.container.find('.thead, .tbody').length != 2) {
                throw new Error('Sortable tables MUST use .thead and .tbody containers!');
            }
        };
        /**
         * Tells us to redirect all sort requests to your callback.
         * The natural sort alograthim included in the class is no longer used.
         * See the "Pager" for more details about working with a server backend.
         */
        Sorter.prototype.UseServer = function (serverCb) {
            this.serverCb = serverCb;
        };
        /**
         * Sets a custom sorter for a given column name.
         *
         * > NOTE: You may provide a default catch-all sorter by supplying
         * > a column name of "*". This will override the included natural
         * > sort method.
         */
        Sorter.prototype.SetCustomSorter = function (column, sorter) {
            this.customSorters[column] = sorter;
        };
        /**
         * In some cases, other features such as the Searcher may redraw the
         * table with new rows. And thus any sorting UI needs to be reset to
         * default.
         */
        Sorter.prototype.ResetSortIcons = function () {
            var icons = this.container.find('.thead i');
            icons.removeClass('fa-sort-asc');
            icons.removeClass('fa-sort-desc');
            icons.addClass('fa-sort');
        };
        /**
         * Given a set of rows we will sort them. This is used by the Searcher
         * to sort a set of matches using the current sort state.
         *
         * > TODO: Refactor the sorter to cache the current sort state.
         */
        Sorter.prototype.Sort = function (rows) {
            var column, sortState;
            var that = this;
            this.container.find('.thead i').each(function (index, element) {
                if ($(element).hasClass('fa-sort-asc')) {
                    sortState = 'asc';
                }
                else if ($(element).hasClass('fa-sort-desc')) {
                    sortState = 'desc';
                }
                if (sortState != null) {
                    column = that.table.GetReader().GetHeading($(element).parent());
                    return false;
                }
            });
            if (sortState != null) {
                rows.sort(this.sortByKey(column, this.selectSorter(column)));
                if (sortState == 'desc')
                    rows.reverse();
            }
        };
        /**
         * This will create an <i> element for each thead cell.
         * The <i> element will be given apprioriate Font Awesome icon classes.
         * Thus it's important that Font Awesome is loaded when using sortable
         * tables. No checks are done you just won't see any sort icons if you
         * forget to include Font Awersome.
         */
        Sorter.prototype.InsertSortableToggles = function () {
            var that = this;
            this.container.find('.thead ul').first().find('.inner').each(function (index, cell) {
                // Don't add sorting to empty cells.
                // Empty cells are most likly to be columns that contain
                // un-sortable data, such as buttons or other HTML elements.
                if ($(cell).text() != "") {
                    $(cell).append('<i class="fa fa-sort"></i>');
                    $(cell).css('cursor', 'pointer');
                    $(cell).click(that.OnSort.bind(that, cell));
                }
            });
        };
        /**
         * Callback for the thead cells click event.
         */
        Sorter.prototype.OnSort = function (cell) {
            // What state of sorting are we currently in?
            // We use the fa icon to tell us that.
            var sortState, icon = $(cell).find('i');
            if (icon.hasClass('fa-sort')) {
                sortState = 'asc';
                icon.removeClass('fa-sort');
                icon.addClass('fa-sort-asc');
            }
            else if (icon.hasClass('fa-sort-asc')) {
                sortState = 'desc';
                icon.removeClass('fa-sort-asc');
                icon.addClass('fa-sort-desc');
            }
            else if (icon.hasClass('fa-sort-desc')) {
                sortState = 'as-loaded';
                icon.removeClass('fa-sort-desc');
                icon.addClass('fa-sort');
            }
            // Right now multicolumn sort is not supported
            // Lets reset all other columns to default
            var otherIcons = this.container.find('.thead i').not(icon);
            otherIcons.removeClass('fa-sort-asc');
            otherIcons.removeClass('fa-sort-desc');
            otherIcons.addClass('fa-sort');
            // If we have a server callback let's use it instead.
            if (this.serverCb != null) {
                this.serverCb(this.table.GetReader().GetHeading($(cell)), sortState);
                return;
            }
            // Now sort the table data and re draw the table
            switch (sortState) {
                case 'asc':
                    this.table.Redraw(this.SortTable(cell), null, true);
                    break;
                case 'desc':
                    this.table.Redraw(this.SortTable(cell, true), null, true);
                    break;
                default:
                    this.table.Redraw(this.table.GetReader().GetSerialized(), null, true);
            }
        };
        /**
         * Given a column we will sort the table based on that column.
         */
        Sorter.prototype.SortTable = function (cell, reverse) {
            if (reverse === void 0) { reverse = false; }
            // Get the column name
            var column = this.table.GetReader().GetHeading($(cell));
            // Create a copy of the table rows that we can then sort
            var rows = this.table.GetReader().GetSerialized().slice(0);
            // Sort the rows
            rows.sort(this.sortByKey(column, this.selectSorter(column)));
            // Reverse the sort if need be
            if (reverse)
                rows.reverse();
            return rows;
        };
        /**
         * Determins which sort method we will use to sort the given column.
         *
         * > NOTE: Refer to the customSorters property for more info.
         */
        Sorter.prototype.selectSorter = function (column) {
            if (this.customSorters.hasOwnProperty(column)) {
                return this.customSorters[column];
            }
            else if (this.customSorters.hasOwnProperty("*")) {
                return this.customSorters["*"];
            }
            throw new Error("No default sorter set!");
        };
        /**
         * Allows us to sort by an objects key.
         */
        Sorter.prototype.sortByKey = function (key, sorter) {
            return function (a, b) {
                return sorter(a[key], b[key]);
            };
        };
        /**
         * Natural Sort algorithm for Javascript
         *
         * @author Jim Palmer (based on chunking idea from Dave Koelle)
         * @see https://github.com/overset/javascript-natural-sort
         */
        Sorter.prototype.naturalSort = function (a, b) {
            var re = /(^([+\-]?(?:\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[\da-fA-F]+$|\d+)/g, sre = /^\s+|\s+$/g, // trim pre-post whitespace
            snre = /\s+/g, // normalize all whitespace to single ' ' character
            dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/, hre = /^0x[0-9a-f]+$/i, ore = /^0/, i = function (s) {
                return (this.caseInsensitive && ('' + s).toLowerCase() || '' + s).replace(sre, '');
            }, 
            // convert all to strings strip whitespace
            x = i(a) || '', y = i(b) || '', 
            // chunk/tokenize
            xN = x.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'), yN = y.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'), 
            // numeric, hex or date detection
            xD = parseInt(x.match(hre) == null ? null : x.match(hre).toString(), 16) || (xN.length !== 1 && Date.parse(x)), yD = parseInt(y.match(hre) == null ? null : y.match(hre).toString(), 16) || xD && y.match(dre) && Date.parse(y) || null, normChunk = function (s, l) {
                // normalize spaces; find floats not starting with '0', string or 0 if not defined (Clint Priest)
                return (!s.match(ore) || l == 1) && parseFloat(s) || s.replace(snre, ' ').replace(sre, '') || 0;
            }, oFxNcL, oFyNcL;
            // first try and sort Hex codes or Dates
            if (yD) {
                if (xD < yD) {
                    return -1;
                }
                else if (xD > yD) {
                    return 1;
                }
            }
            // natural sorting through split numeric strings and default strings
            for (var cLoc = 0, xNl = xN.length, yNl = yN.length, numS = Math.max(xNl, yNl); cLoc < numS; cLoc++) {
                oFxNcL = normChunk(xN[cLoc], xNl);
                oFyNcL = normChunk(yN[cLoc], yNl);
                // handle numeric vs string comparison - number < string - (Kyle Adams)
                if (isNaN(oFxNcL) !== isNaN(oFyNcL)) {
                    return (isNaN(oFxNcL)) ? 1 : -1;
                }
                else if (typeof oFxNcL !== typeof oFyNcL) {
                    oFxNcL += '';
                    oFyNcL += '';
                }
                if (oFxNcL < oFyNcL) {
                    return -1;
                }
                if (oFxNcL > oFyNcL) {
                    return 1;
                }
            }
            return 0;
        };
        return Sorter;
    })();
    SexyTable.Sorter = Sorter;
})(SexyTable || (SexyTable = {}));
////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    /**
     * Represents a Single SexyTable.
     */
    var Table = (function () {
        /**
         * Give us the tables top level container element.
         * Eg: <div class="sexy-table"></div>
         */
        function Table(table) {
            this.container = $(table);
            // Assign ourself to the table DOM data for easy retrieval
            this.container.data('sexy-table', this);
            // Automatically make the table writeable if Transparency
            // is loaded and it contains a data bind template.
            if (typeof Transparency != 'undefined') {
                if (this.container.find('.tbody[data-bind]').length == 1) {
                    this.MakeWriteable();
                    // Bail out at this point there is no point continuing
                    // because the table only contains a template and no data.
                    return;
                }
            }
            // It's important this runs early on as pretty much
            // everything else assumes this has been done.
            this.InsertCellWrapper();
            // Create a new table reader, this will serialize the DOM into an
            // Object so we don't have to read the DOM for every operation.
            this.reader = new SexyTable.Reader(this);
            // Automatically make the table sortable if it has the class
            if (this.container.hasClass('sortable')) {
                this.MakeSortable();
            }
            // Automatically make the table filterable if it has the class
            if (this.container.hasClass('filterable')) {
                this.MakeFilterable();
            }
            // Up until this point the table will be hidden from view by css.
            // The sizer will automatically calculate the width of the height
            // of the table cells and then show the table.
            this.sizer = new SexyTable.Sizer(this);
            // Automatically make the table editable if it has the class
            if (this.container.hasClass('editable')) {
                this.MakeEditable();
            }
            // Automatically make the table searchable if Lunr has been loaded.
            if (typeof lunr != 'undefined') {
                this.MakeSearchable();
            }
        }
        Table.prototype.GetContainer = function () {
            return this.container;
        };
        Table.prototype.GetReader = function () {
            if (this.reader == null) {
                throw new Error('Table Reader not yet created!');
            }
            return this.reader;
        };
        Table.prototype.HasReader = function () {
            return (this.reader != null);
        };
        Table.prototype.GetWriter = function () {
            if (this.writer == null) {
                throw new Error('Table is not Writeable! Use MakeWriteable.');
            }
            return this.writer;
        };
        Table.prototype.HasWriter = function () {
            return (this.writer != null);
        };
        Table.prototype.GetSizer = function () {
            if (this.sizer == null) {
                throw new Error('Table Sizer not yet created!');
            }
            return this.sizer;
        };
        Table.prototype.HasSizer = function () {
            return (this.sizer != null);
        };
        Table.prototype.GetSorter = function () {
            if (this.sorter == null) {
                throw new Error('Table is not Sortable! Use MakeSortable.');
            }
            return this.sorter;
        };
        Table.prototype.HasSorter = function () {
            return (this.sorter != null);
        };
        Table.prototype.GetSearcher = function () {
            if (this.searcher == null) {
                throw new Error('Table is not Searchable! Use MakeSearchable.');
            }
            return this.searcher;
        };
        Table.prototype.HasSearcher = function () {
            return (this.searcher != null);
        };
        Table.prototype.GetFilterer = function () {
            if (this.filterer == null) {
                throw new Error('Table is not Filterable! Use MakeFilterable.');
            }
            return this.filterer;
        };
        Table.prototype.HasFilterer = function () {
            return (this.filterer != null);
        };
        Table.prototype.GetPager = function () {
            if (this.pager == null) {
                throw new Error('Table is not Pageable! Use MakePageable.');
            }
            return this.pager;
        };
        Table.prototype.HasPager = function () {
            return (this.pager != null);
        };
        Table.prototype.GetEditor = function () {
            if (this.editor == null) {
                throw new Error('Table is not Editable! Use MakeEditable.');
            }
            return this.editor;
        };
        Table.prototype.HasEditor = function () {
            return (this.editor != null);
        };
        /**
         * Creates a new Editor for the table.
         */
        Table.prototype.MakeEditable = function () {
            if (this.editor != null)
                return;
            if (typeof Mousetrap == 'undefined') {
                throw new Error('Editable tables require mousetrap.js ' +
                    'see: https://craig.is/killing/mice');
            }
            this.editor = new SexyTable.Editor(this);
            return this.editor;
        };
        /**
         * Creates a new Pager for the table.
         * This allows the table to interact with a server backend.
         */
        Table.prototype.MakePageable = function (nextCb) {
            if (this.pager != null)
                return;
            // Pageable tables must be writeable
            this.MakeWriteable();
            this.pager = new SexyTable.Pager(this, nextCb);
            return this.pager;
        };
        /**
         * Create a new Writer for the table.
         * This will allow tables to be created at runtime from JSON,
         * instead of existing HTML Markup.
         */
        Table.prototype.MakeWriteable = function () {
            if (this.writer != null)
                return;
            if (typeof Transparency == 'undefined') {
                throw new Error('Writeable tables require transparency.js ' +
                    'see: http://leonidas.github.io/transparency/');
            }
            if (this.container.find('.tbody[data-bind]').length == 0) {
                throw new Error('Writeable tables require a tbody container ' +
                    'that contains a transparency template.');
            }
            this.writer = new SexyTable.Writer(this);
            return this.writer;
        };
        /**
         * Each LI element represents a cell of the table.
         * However for various styling reasons we need to insert an inner
         * container. Unsemantic markup is one of my pet hates thus we do
         * this using javascript.
         */
        Table.prototype.InsertCellWrapper = function () {
            this.container.find('li').each(function (index, cell) {
                // Ensure we don't wrap an inner container
                // with another inner container.
                if ($(cell).find('.inner').length == 0) {
                    // Don't wrap anything inside the data bind template
                    if ($(cell).parents('.data-bind-template').length == 0) {
                        $(cell).wrapInner('<div class="inner"></div>');
                    }
                }
            });
        };
        /**
         * Programatically make a table sortable.
         */
        Table.prototype.MakeSortable = function () {
            if (this.sorter != null)
                return;
            // If this method is called manually the table may not have the
            // sortable class. We will add it here so that it gets the correct
            // styles applied to it.
            if (!this.container.hasClass('sortable')) {
                this.container.addClass('sortable');
            }
            this.sorter = new SexyTable.Sorter(this);
            return this.sorter;
        };
        /**
         * Programatically make a table searchable.
         */
        Table.prototype.MakeSearchable = function () {
            if (this.searcher != null)
                return;
            // If this method is called manually and Lunr has not been loaded
            // we will throw an error telling the dev to include Lunr.js
            if (typeof lunr == 'undefined') {
                throw new Error('Searchable tables require Lunr! ' +
                    'Get it from http://lunrjs.com/');
            }
            this.searcher = new SexyTable.Searcher(this);
            return this.searcher;
        };
        /**
         * Programatically make a table filterable.
         */
        Table.prototype.MakeFilterable = function () {
            if (this.filterer != null)
                return;
            // A filterable table must be searchable
            this.MakeSearchable();
            // If this method is called manually the table may not have the
            // filterable class. We will add it here so that it gets the
            // correct styles applied to it.
            if (!this.container.hasClass('filterable')) {
                this.container.addClass('filterable');
            }
            this.filterer = new SexyTable.Filterer(this);
            return this.filterer;
        };
        /**
         * Given an array of either serialized rows as created by the Reader.
         * Or an array of DOM Elements, this will empty the contents of the
         * tables tbody container and recreate it with the suppplied table rows.
         */
        Table.prototype.Redraw = function (rows, reSerialize, quick) {
            if (reSerialize === void 0) { reSerialize = false; }
            if (quick === void 0) { quick = false; }
            if (this.container.find('.tbody').length == 0) {
                throw new Error('Redrawing requires a .tbody container!');
            }
            if (typeof rows[0] == 'undefined' || typeof rows[0] == 'function') {
                this.container.find('.tbody').empty();
                return;
            }
            var elements = new Array();
            if (typeof rows[0]['_dom'] != 'undefined') {
                for (var row in rows) {
                    elements.push(rows[row]["_dom"]);
                }
            }
            else {
                elements = rows;
            }
            this.container.find('.tbody').empty().append(elements);
            // Running the Sizer is slow, we will opt out in some cases.
            if (!quick) {
                this.InsertCellWrapper();
                this.sizer.ForceResize();
            }
            if (reSerialize)
                this.reader.Serialize();
            if (this.HasEditor())
                this.editor.ReAttachEventHandlers();
        };
        /**
         * Quick shortcut to reset the table back to it's original
         * state before any sorting, searching, filtering, etc...
         */
        Table.prototype.Reset = function () {
            this.Redraw(this.reader.GetOriginal(), true, true);
            try {
                this.GetSorter().ResetSortIcons();
            }
            catch (e) { }
            try {
                this.GetFilterer().ResetFilters();
            }
            catch (e) { }
        };
        /**
         * When new data has been added to the table,
         * you may call this to rerun the table initialisation.
         */
        Table.prototype.Refresh = function () {
            // Essure all table cells contain the inner wrapper
            this.InsertCellWrapper();
            // We have added new data to the table so we need to re-read the
            // table into the reader, updating it's "original" state if need be.
            try {
                this.GetReader().Serialize(true);
            }
            catch (e) {
                this.reader = new SexyTable.Reader(this);
            }
            // Make the table sortable.
            //
            // NOTE: We do not reset the sort state and icons here as in some
            // cases we will want to append data to the table and maintain the
            // current sort state. ie: When Paging.
            if (this.sorter == null && this.container.hasClass('sortable')) {
                this.MakeSortable();
            }
            // Make the table filterable.
            //
            // NOTE: Again we do not reset any of the filters for the same
            // reason as the sorter.
            if (this.filterer == null && this.container.hasClass('filterable')) {
                this.MakeFilterable();
            }
            // Force a resize of the table after adding the data
            try {
                this.GetSizer().ForceResize();
            }
            catch (e) {
                this.sizer = new SexyTable.Sizer(this);
            }
            // Make the table editable.
            try {
                this.GetEditor().InsertEditFields();
            }
            catch (e) {
                if (this.container.hasClass('editable')) {
                    this.MakeEditable();
                }
            }
            // Then we will rebuild the Lunr Indexes
            //
            // NOTE: When using the Pager, Lunr Indexes will not get built.
            // No point doing work we don't need to do.
            try {
                this.GetSearcher().BuildIndexes();
            }
            catch (e) {
                if (typeof lunr != 'undefined') {
                    this.MakeSearchable();
                }
            }
        };
        /**
         * Grabs all rows from the table.
         */
        Table.prototype.GetRows = function () {
            return this.container.find('ul').not(this.container.find('.data-bind-template ul'));
        };
        /**
         * Grabs all cells in the table.
         */
        Table.prototype.GetCells = function () {
            return this.container.find('li').not(this.container.find('.data-bind-template li'));
        };
        /**
         * Creates a multi-dimensional array with all cells
         * from the table grouped by column.
         */
        Table.prototype.GetColumns = function () {
            var columns = [];
            this.GetRows().each(function (rowNo, row) {
                $(row).find('li').each(function (colNo, cell) {
                    if (typeof columns[colNo] == 'undefined')
                        columns.push([]);
                    columns[colNo].push(cell);
                });
            });
            return columns;
        };
        return Table;
    })();
    SexyTable.Table = Table;
})(SexyTable || (SexyTable = {}));
////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
var SexyTable;
(function (SexyTable) {
    var Writer = (function () {
        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        function Writer(table) {
            this.table = table;
            this.container = this.table.GetContainer();
            this.CreateDataBindTemplate();
        }
        Writer.prototype.GetDirectives = function () {
            return this.directives;
        };
        Writer.prototype.SetDirectives = function (value) {
            this.directives = value;
        };
        /**
         * Appends data to the table, then re-initialises the table.
         */
        Writer.prototype.Append = function (viewmodel, directives) {
            // Grab the template
            var template = this.container.find('.data-bind-template');
            // Render the viewmodel into the template
            template.render(viewmodel, directives == null ? this.directives : directives);
            // Clone the results
            var newData = template.children('div').children().clone();
            // Remove any ids created in the template,
            // this will ensure we don't get conflicts.
            template.find('*[id]').removeAttr('id');
            // Append the new data to the existing tbody
            this.container.find('.tbody').append(newData);
            // Remove any data-bind attributes to ensure
            // we do not get any future confusion.
            this.container.find('.tbody *[data-bind]').removeAttr('data-bind');
            // Re-initialises the table.
            this.table.Refresh();
        };
        /**
         * Replaces the current data in the table with this new data.
         */
        Writer.prototype.Replace = function (viewmodel, directives) {
            this.container.find('.tbody').empty();
            this.Append(viewmodel, directives);
        };
        /**
         * Moves the Data Bind Template.
         *
         * If we leave the template as it is as part of the tbody container.
         * We can't render new rows into the table, as whatever data we pass to
         * the View Framework will override what already exists.
         *
         * > NOTE: This is the case with transparency.js ast least I can't
         * > comment for others but I am making an assumption they will be
         * > similar.
         *
         * Therefore we move the template and hide it too.
         * Then we can render new results into the template and append them
         * into tbody. We can do this as many times as we like.
         */
        Writer.prototype.CreateDataBindTemplate = function () {
            var template = $('<div></div>');
            template = template.addClass('data-bind-template').hide();
            template.append(this.container.find('.tbody').clone().removeAttr('class'));
            this.container.append(template);
            this.container.find('.tbody').empty().removeAttr('data-bind');
        };
        return Writer;
    })();
    SexyTable.Writer = Writer;
})(SexyTable || (SexyTable = {}));
