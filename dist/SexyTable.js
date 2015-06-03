var SexyTable;
(function (SexyTable) {
    SexyTable.AutoMakeSexy = true;
    $(document).ready(function () {
        if (SexyTable.AutoMakeSexy) {
            $('.sexy-table').each(function (index, table) {
                new SexyTable.Table(table);
            });
        }
    });
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== 'function') {
                throw new TypeError('Function.prototype.bind - ' + 'what is trying to be bound is not callable');
            }
            var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () {
            }, fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
            };
            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();
            return fBound;
        };
    }
})(SexyTable || (SexyTable = {}));
var SexyTable;
(function (SexyTable) {
    var Filterer = (function () {
        function Filterer(table) {
            this.table = table;
            this.container = this.table.GetContainer();
            this.EnsureTableHasThead();
            this.InsertFilterInputs();
        }
        Filterer.prototype.EnsureTableHasThead = function () {
            if (this.container.find('.thead, .tbody').length != 2) {
                throw new Error('Sortable tables MUST use .thead and .tbody containers!');
            }
        };
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
        Filterer.prototype.OnFilter = function (filter) {
            this.container.find('.thead input').not(filter).val('');
            this.table.GetSearcher().Query($(filter).val(), $(filter).attr('name'));
        };
        return Filterer;
    })();
    SexyTable.Filterer = Filterer;
})(SexyTable || (SexyTable = {}));
var SexyTable;
(function (SexyTable) {
    var Reader = (function () {
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
        Reader.prototype.Serialize = function () {
            this.serialized = [];
            this.headings = this.ExtractHeadings();
            if (this.container.find('.tbody').length == 0) {
                this.container.find('ul').each(this.AddRow.bind(this));
            }
            else {
                this.container.find('.tbody ul').each(this.AddRow.bind(this));
            }
            return this.serialized;
        };
        Reader.prototype.ExtractHeadings = function () {
            var headings = [];
            if (this.container.find('.thead').length == 0) {
                var cols = this.container.find('ul').first().find('li').length;
                for (var i = 0; i < cols; i++)
                    headings.push("col_" + i);
            }
            else {
                this.container.find('.thead ul').first().find('li').each(function (index, cell) {
                    headings.push($(cell).find('.inner').text().toLowerCase().replace(" ", "_"));
                });
            }
            return headings;
        };
        Reader.prototype.AddRow = function (rowNo, row) {
            var rowData = {}, that = this;
            rowData['_guid'] = this.CreateGuid();
            rowData['_dom'] = row;
            $(row).find('li').each(function (cellNo, cell) {
                if (that.headings[cellNo] != "") {
                    rowData[that.headings[cellNo]] = $(cell).find('.inner').text();
                }
            });
            this.serialized.push(rowData);
        };
        Reader.prototype.CreateGuid = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        return Reader;
    })();
    SexyTable.Reader = Reader;
})(SexyTable || (SexyTable = {}));
var SexyTable;
(function (SexyTable) {
    var Searcher = (function () {
        function Searcher(table) {
            this.table = table;
            this.container = this.table.GetContainer();
            this.EnsureTableHasThead();
            this.BuildIndexes();
        }
        Searcher.prototype.Query = function (terms, column) {
            if (column === void 0) { column = 'all'; }
            if (terms == null || terms == "") {
                this.ResetTable();
                return;
            }
            var results = new Array();
            if (column == 'all') {
                results = this.index.search(terms);
            }
            else {
                results = this.perColIndex.search(column + ":" + terms);
            }
            var matches = new Array();
            var original = this.table.GetReader().GetOriginal();
            for (var result in results) {
                for (var row in original) {
                    if (results[result].ref == original[row]['_guid']) {
                        matches.push(original[row]);
                    }
                }
            }
            this.table.Redraw(matches, true);
            try {
                this.table.GetSorter().ResetSortIcons();
            }
            catch (e) {
            }
        };
        Searcher.prototype.ResetTable = function () {
            this.table.Reset();
            try {
                this.table.GetSorter().ResetSortIcons();
            }
            catch (e) {
            }
        };
        Searcher.prototype.EnsureTableHasThead = function () {
            if (this.container.find('.thead, .tbody').length != 2) {
                throw new Error('Searchable tables MUST use .thead and .tbody containers!');
            }
        };
        Searcher.prototype.BuildIndexes = function () {
            this.index = this.BuildIndexSchema();
            this.perColIndex = this.BuildIndexSchema();
            var data = this.table.GetReader().GetSerialized();
            for (var row in data) {
                var documentAll = {}, documentCol = {};
                for (var column in data[row]) {
                    if (column == '_guid') {
                        documentAll[column] = data[row][column];
                        documentCol[column] = data[row][column];
                    }
                    else if (column != '_dom') {
                        documentAll[column] = data[row][column];
                        documentCol[column] = column + ":" + data[row][column];
                    }
                }
                this.index.add(documentAll);
                this.perColIndex.add(documentCol);
            }
        };
        Searcher.prototype.BuildIndexSchema = function () {
            var headings = this.table.GetReader().GetHeadings();
            return lunr(function () {
                this.ref('_guid');
                for (var i = 0; i < headings.length; i++) {
                    if (headings[i] != '_guid' && headings[i] != '_dom') {
                        this.field(headings[i]);
                    }
                }
            });
        };
        return Searcher;
    })();
    SexyTable.Searcher = Searcher;
})(SexyTable || (SexyTable = {}));
var SexyTable;
(function (SexyTable) {
    var Sizer = (function () {
        function Sizer(table) {
            this.table = table;
            this.container = this.table.GetContainer();
            this.SetWidthOfCells();
            this.SetHeightOfRows();
            this.UnhideContainer();
            $(window).resize(this.SetWidthOfCells.bind(this));
            $(window).resize(this.SetHeightOfRows.bind(this));
        }
        Sizer.prototype.SetHeightOfRows = function () {
            var that = this;
            this.container.find('ul').css('height', 'auto');
            this.container.find('ul').each(function (index, row) {
                $(row).css('height', that.CalculateRowHeight(row));
            });
        };
        Sizer.prototype.CalculateRowHeight = function (row) {
            var maxHeight = -1;
            $(row).find('li').each(function (index, cell) {
                if ($(cell).outerHeight(true) > maxHeight) {
                    maxHeight = $(cell).outerHeight(true);
                }
            });
            return maxHeight;
        };
        Sizer.prototype.SetWidthOfCells = function () {
            this.container.find('li').css('width', this.CalculateCellWidth());
        };
        Sizer.prototype.CalculateCellWidth = function () {
            var cols = this.GetNumberOfCols();
            var width = this.GetTotalWidthOfTable();
            var padding = this.GetCellPadding();
            return (width / cols) - padding;
        };
        Sizer.prototype.UnhideContainer = function () {
            this.container.css('visibility', 'visible');
        };
        Sizer.prototype.GetTotalWidthOfTable = function () {
            var rect = this.container[0].getBoundingClientRect();
            var width;
            if (rect.width) {
                width = rect.width;
            }
            else {
                width = rect.right - rect.left;
            }
            return width;
        };
        Sizer.prototype.GetNumberOfCols = function () {
            return this.container.find('ul').first().find('li').length;
        };
        Sizer.prototype.GetCellPadding = function () {
            var firstCell = this.container.find('li').first();
            return firstCell.outerWidth(true) - firstCell.width();
        };
        return Sizer;
    })();
    SexyTable.Sizer = Sizer;
})(SexyTable || (SexyTable = {}));
var SexyTable;
(function (SexyTable) {
    var Sorter = (function () {
        function Sorter(table) {
            this.table = table;
            this.caseInsensitive = true;
            this.container = this.table.GetContainer();
            this.EnsureTableHasThead();
            this.InsertSortableToggles();
        }
        Sorter.prototype.ResetSortIcons = function () {
            var icons = this.container.find('.thead i');
            icons.removeClass('fa-sort-asc');
            icons.removeClass('fa-sort-desc');
            icons.addClass('fa-sort');
        };
        Sorter.prototype.EnsureTableHasThead = function () {
            if (this.container.find('.thead, .tbody').length != 2) {
                throw new Error('Sortable tables MUST use .thead and .tbody containers!');
            }
        };
        Sorter.prototype.InsertSortableToggles = function () {
            var that = this;
            this.container.find('.thead ul').first().find('.inner').each(function (index, cell) {
                if ($(cell).text() != "") {
                    $(cell).append('<i class="fa fa-sort"></i>');
                    $(cell).css('cursor', 'pointer');
                    $(cell).click(that.OnSort.bind(that, cell));
                }
            });
        };
        Sorter.prototype.OnSort = function (cell) {
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
            var otherIcons = this.container.find('.thead i').not(icon);
            otherIcons.removeClass('fa-sort-asc');
            otherIcons.removeClass('fa-sort-desc');
            otherIcons.addClass('fa-sort');
            switch (sortState) {
                case 'asc':
                    this.table.Redraw(this.SortTable(cell));
                    break;
                case 'desc':
                    this.table.Redraw(this.SortTable(cell, true));
                    break;
                default:
                    this.table.Redraw(this.table.GetReader().GetSerialized());
            }
        };
        Sorter.prototype.SortTable = function (cell, reverse) {
            if (reverse === void 0) { reverse = false; }
            var column = $(cell).text().toLowerCase().replace(" ", "_");
            var rows = this.table.GetReader().GetSerialized().slice(0);
            rows.sort(this.sortByKey(column));
            if (reverse)
                rows.reverse();
            return rows;
        };
        Sorter.prototype.sortByKey = function (key) {
            var that = this;
            return function (a, b) {
                return that.naturalSort(a[key], b[key]);
            };
        };
        Sorter.prototype.naturalSort = function (a, b) {
            var re = /(^([+\-]?(?:\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[\da-fA-F]+$|\d+)/g, sre = /^\s+|\s+$/g, snre = /\s+/g, dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/, hre = /^0x[0-9a-f]+$/i, ore = /^0/, i = function (s) {
                return (this.caseInsensitive && ('' + s).toLowerCase() || '' + s).replace(sre, '');
            }, x = i(a) || '', y = i(b) || '', xN = x.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'), yN = y.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'), xD = parseInt(x.match(hre) == null ? null : x.match(hre).toString(), 16) || (xN.length !== 1 && Date.parse(x)), yD = parseInt(y.match(hre) == null ? null : y.match(hre).toString(), 16) || xD && y.match(dre) && Date.parse(y) || null, normChunk = function (s, l) {
                return (!s.match(ore) || l == 1) && parseFloat(s) || s.replace(snre, ' ').replace(sre, '') || 0;
            }, oFxNcL, oFyNcL;
            if (yD) {
                if (xD < yD) {
                    return -1;
                }
                else if (xD > yD) {
                    return 1;
                }
            }
            for (var cLoc = 0, xNl = xN.length, yNl = yN.length, numS = Math.max(xNl, yNl); cLoc < numS; cLoc++) {
                oFxNcL = normChunk(xN[cLoc], xNl);
                oFyNcL = normChunk(yN[cLoc], yNl);
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
var SexyTable;
(function (SexyTable) {
    var Table = (function () {
        function Table(table) {
            this.container = $(table);
            this.container.data('sexy-table', this);
            this.InsertCellWrapper();
            this.reader = new SexyTable.Reader(this);
            if (this.container.hasClass('sortable')) {
                this.MakeSortable();
            }
            if (this.container.hasClass('filterable')) {
                this.MakeFilterable();
            }
            this.sizer = new SexyTable.Sizer(this);
            if (typeof lunr != 'undefined') {
                this.MakeSearchable();
            }
        }
        Table.prototype.GetContainer = function () {
            return this.container;
        };
        Table.prototype.GetReader = function () {
            return this.reader;
        };
        Table.prototype.GetSizer = function () {
            return this.sizer;
        };
        Table.prototype.GetSorter = function () {
            if (this.sorter == null) {
                throw new Error('Table is not Sortable! Use MakeSortable.');
            }
            return this.sorter;
        };
        Table.prototype.GetSearcher = function () {
            if (this.searcher == null) {
                throw new Error('Table is not Searchable! Use MakeSearchable.');
            }
            return this.searcher;
        };
        Table.prototype.GetFilterer = function () {
            if (this.filterer == null) {
                throw new Error('Table is not Filterable! Use MakeFilterable.');
            }
            return this.filterer;
        };
        Table.prototype.InsertCellWrapper = function () {
            this.container.find('li').wrapInner('<div class="inner"></div>');
        };
        Table.prototype.MakeSortable = function () {
            if (this.sorter != null)
                return;
            if (!this.container.hasClass('sortable')) {
                this.container.addClass('sortable');
            }
            this.sorter = new SexyTable.Sorter(this);
        };
        Table.prototype.MakeSearchable = function () {
            if (this.searcher != null)
                return;
            if (typeof lunr == 'undefined') {
                throw new Error('Searchable tables require Lunr! ' + 'Get it from http://lunrjs.com/');
            }
            this.searcher = new SexyTable.Searcher(this);
        };
        Table.prototype.MakeFilterable = function () {
            if (this.filterer != null)
                return;
            this.MakeSearchable();
            if (!this.container.hasClass('filterable')) {
                this.container.addClass('filterable');
            }
            this.filterer = new SexyTable.Filterer(this);
        };
        Table.prototype.Redraw = function (rows, reSerialize) {
            if (reSerialize === void 0) { reSerialize = false; }
            if (this.container.find('.tbody').length == 0) {
                throw new Error('Redrawing requires a .tbody container!');
            }
            if (typeof rows[0] == 'undefined') {
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
            if (reSerialize)
                this.reader.Serialize();
        };
        Table.prototype.Reset = function () {
            this.Redraw(this.reader.GetOriginal(), true);
        };
        return Table;
    })();
    SexyTable.Table = Table;
})(SexyTable || (SexyTable = {}));
