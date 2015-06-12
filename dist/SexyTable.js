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
        Filterer.prototype.ResetFilters = function () {
            this.container.find('.thead input').val('');
        };
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
    var Pager = (function () {
        function Pager(table, nextCb) {
            this.table = table;
            this.nextCb = nextCb;
            this.FirstPage = false;
            this.rows = 0;
            this.atEnd = false;
            this.container = this.table.GetContainer();
            if (this.container.find('.tbody').is(':empty')) {
                this.FirstPage = true;
                this.GetNext();
            }
            $(window).scroll(this.OnScroll.bind(this));
        }
        Pager.prototype.OnScroll = function () {
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
        Pager.prototype.OnSort = function (column, direction) {
            this.rows = 0;
            this.atEnd = false;
            this.sort = { 'column': column, 'direction': direction };
            this.GetNext();
        };
        Pager.prototype.OnSearch = function (column, terms) {
            this.rows = 0;
            this.atEnd = false;
            this.search = { 'column': column, 'terms': terms };
            this.GetNext();
        };
        Pager.prototype.GetNext = function () {
            this.nextCb(this.rows, this.sort, this.search, this.OnResponse.bind(this));
        };
        Pager.prototype.OnResponse = function (response) {
            if (response == null) {
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
                catch (e) {
                }
                try {
                    this.table.GetSearcher().UseServer(this.OnSearch.bind(this));
                }
                catch (e) {
                }
                this.FirstPage = false;
            }
        };
        return Pager;
    })();
    SexyTable.Pager = Pager;
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
        Searcher.prototype.EnsureTableHasThead = function () {
            if (this.container.find('.thead, .tbody').length != 2) {
                throw new Error('Searchable tables MUST use .thead and .tbody containers!');
            }
        };
        Searcher.prototype.UseServer = function (serverCb) {
            this.serverCb = serverCb;
        };
        Searcher.prototype.Query = function (terms, column) {
            if (column === void 0) { column = 'all'; }
            if (terms == null || terms == "") {
                this.table.Reset();
                return;
            }
            if (this.serverCb != null) {
                this.serverCb(column, terms);
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
            matches = this.table.GetSorter().Sort(matches);
            this.table.Redraw(matches, true);
        };
        Searcher.prototype.BuildIndexes = function () {
            if (this.serverCb != null)
                return;
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
            this.ForceResize();
            this.UnhideContainer();
            $(window).resize(this.ForceResize.bind(this));
        }
        Sizer.prototype.ForceResize = function () {
            this.container.width('100%');
            this.table.GetCells().removeData('dont-resize');
            this.table.GetCells().css('width', 'auto');
            this.table.GetRows().css('height', 'auto');
            this.SetWidthOfColumns();
            this.SetHeightOfRows();
        };
        Sizer.prototype.SetHeightOfRows = function () {
            var that = this;
            this.table.GetRows().each(function (index, row) {
                $(row).css('height', that.CalculateRowHeight(row));
            });
            var last = this.table.GetRows().last();
            last.css('height', last.outerHeight(true) + this.GetRowBorder());
        };
        Sizer.prototype.CalculateRowHeight = function (row) {
            var maxHeight = -1;
            $(row).find('li').each(function (index, cell) {
                if ($(cell).outerHeight(true) > maxHeight) {
                    maxHeight = $(cell).outerHeight(true);
                }
            });
            return maxHeight + this.GetRowBorder();
        };
        Sizer.prototype.SetWidthOfColumns = function () {
            var columns = this.table.GetColumns();
            var colWidths = [];
            columns.forEach(function (col) {
                var maxWidth = -1;
                col.forEach(function (cell) {
                    var cellWidth = $(cell).outerWidth(true);
                    if (cellWidth > maxWidth) {
                        maxWidth = cellWidth;
                    }
                }, this);
                colWidths.push(maxWidth);
            }, this);
            var totalWidth = colWidths.reduce(function (a, b) {
                return a + b;
            }, 0);
            columns.forEach(function (col, colNo) {
                var width = ((colWidths[colNo] / totalWidth * 100) - 1) + '%';
                col.forEach(function (cell) {
                    $(cell).css('width', width);
                });
            });
            var that = this;
            var recursive = function () {
                var remove = 0;
                columns.forEach(function (col, colNo) {
                    var widths = that.GetColWidths(col);
                    remove = remove + widths.diff;
                    col.forEach(function (cell) {
                        if ($(cell).data('dont-resize') !== true) {
                            $(cell).css('width', widths.max);
                        }
                        if (widths.diff > 0)
                            $(cell).data('dont-resize', true);
                    });
                });
                var resizeable_cols = that.GetResizeableCols();
                remove = remove / resizeable_cols;
                var nothingLeftToResize = true;
                columns.forEach(function (col, colNo) {
                    col.forEach(function (cell) {
                        if ($(cell).data('dont-resize') !== true) {
                            nothingLeftToResize = false;
                            var newWidth = $(cell).outerWidth(true) - remove;
                            $(cell).css('width', newWidth);
                            var innerWidth = $(cell).find('.inner').outerWidth(true);
                            if (innerWidth > newWidth) {
                                if (resizeable_cols > 1) {
                                    recursive();
                                }
                                else {
                                    col.forEach(function (cell1) {
                                        $(cell1).css('width', innerWidth);
                                        $(cell1).data('dont-resize', true);
                                    });
                                    var finalWidth = that.GetColWidths(col).max;
                                    col.forEach(function (cell1) {
                                        $(cell1).css('width', finalWidth);
                                    });
                                    nothingLeftToResize = true;
                                }
                            }
                        }
                    });
                });
                if (nothingLeftToResize) {
                    var minimumSize = 0;
                    var row = that.table.GetRows().first();
                    row.find('li').each(function (index, el) {
                        minimumSize = minimumSize + $(el).outerWidth(true);
                    });
                    minimumSize = minimumSize + (that.GetColumnBorder() * 2);
                    that.container.css('width', minimumSize);
                }
            };
            recursive();
        };
        Sizer.prototype.GetResizeableCols = function () {
            var resizeable_cols = this.GetNumberOfCols();
            this.table.GetColumns().forEach(function (col, colNo) {
                var dontRezise = false;
                col.forEach(function (cell) {
                    if ($(cell).data('dont-resize') === true) {
                        dontRezise = true;
                    }
                });
                if (dontRezise)
                    --resizeable_cols;
            });
            return resizeable_cols;
        };
        Sizer.prototype.GetColWidths = function (col) {
            var widths = [];
            for (var i = 0; i < col.length; i++) {
                widths.push($(col[i]).find('.inner').outerWidth(true) + this.GetColumnBorder());
            }
            var min = Math.min.apply(null, widths);
            var max = Math.max.apply(null, widths);
            var diff = max - min;
            return { widths: widths, min: min, max: max, diff: diff };
        };
        Sizer.prototype.GetRowBorder = function () {
            var row = this.container.find('ul').first();
            return row.outerWidth(true) - row.innerWidth();
        };
        Sizer.prototype.GetColumnBorder = function () {
            var cell = this.container.find('li').first();
            return cell.outerWidth(true) - cell.innerWidth();
        };
        Sizer.prototype.CalculateCellWidth = function () {
            return ((1 / this.GetNumberOfCols()) * 100) + '%';
        };
        Sizer.prototype.GetNumberOfCols = function () {
            return this.table.GetColumns().length;
        };
        Sizer.prototype.UnhideContainer = function () {
            this.container.css('visibility', 'visible');
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
        Sorter.prototype.EnsureTableHasThead = function () {
            if (this.container.find('.thead, .tbody').length != 2) {
                throw new Error('Sortable tables MUST use .thead and .tbody containers!');
            }
        };
        Sorter.prototype.UseServer = function (serverCb) {
            this.serverCb = serverCb;
        };
        Sorter.prototype.ResetSortIcons = function () {
            var icons = this.container.find('.thead i');
            icons.removeClass('fa-sort-asc');
            icons.removeClass('fa-sort-desc');
            icons.addClass('fa-sort');
        };
        Sorter.prototype.Sort = function (rows) {
            var column, sortState;
            this.container.find('.thead i').each(function (index, element) {
                if ($(element).hasClass('fa-sort-asc')) {
                    sortState = 'asc';
                }
                else if ($(element).hasClass('fa-sort-desc')) {
                    sortState = 'desc';
                }
                if (sortState != null) {
                    column = $(element).parent().text().toLowerCase().replace(" ", "_");
                    return false;
                }
            });
            if (sortState != null) {
                rows.sort(this.sortByKey(column));
                if (sortState == 'desc')
                    rows.reverse();
            }
            return rows;
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
            if (this.serverCb != null) {
                this.serverCb($(cell).text().toLowerCase().replace(" ", "_"), sortState);
                return;
            }
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
            if (typeof Transparency != 'undefined') {
                if (this.container.find('.tbody[data-bind]').length == 1) {
                    this.MakeWriteable();
                    return;
                }
            }
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
            if (this.reader == null) {
                throw new Error('Table Reader not yet created!');
            }
            return this.reader;
        };
        Table.prototype.GetWriter = function () {
            if (this.writer == null) {
                throw new Error('Table is not Writeable! Use MakeWriteable.');
            }
            return this.writer;
        };
        Table.prototype.GetSizer = function () {
            if (this.sizer == null) {
                throw new Error('Table Sizer not yet created!');
            }
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
        Table.prototype.GetPager = function () {
            if (this.pager == null) {
                throw new Error('Table is not Pageable! Use MakePageable.');
            }
            return this.pager;
        };
        Table.prototype.MakePageable = function (nextCb) {
            if (this.pager != null)
                return;
            this.MakeWriteable();
            this.pager = new SexyTable.Pager(this, nextCb);
        };
        Table.prototype.MakeWriteable = function () {
            if (this.writer != null)
                return;
            if (typeof Transparency == 'undefined') {
                throw new Error('Writeable tables require transparency.js ' + 'see: http://leonidas.github.io/transparency/');
            }
            if (this.container.find('.tbody[data-bind]').length == 0) {
                throw new Error('Writeable tables require a tbody container ' + 'that contains a transparency template.');
            }
            this.writer = new SexyTable.Writer(this);
        };
        Table.prototype.InsertCellWrapper = function () {
            this.container.find('li').each(function (index, cell) {
                if ($(cell).find('.inner').length == 0) {
                    if ($(cell).parents('.data-bind-template').length == 0) {
                        $(cell).wrapInner('<div class="inner"></div>');
                    }
                }
            });
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
            this.InsertCellWrapper();
            this.sizer.ForceResize();
            if (reSerialize)
                this.reader.Serialize();
        };
        Table.prototype.Reset = function () {
            this.Redraw(this.reader.GetOriginal(), true);
            try {
                this.GetSorter().ResetSortIcons();
            }
            catch (e) {
            }
            try {
                this.GetFilterer().ResetFilters();
            }
            catch (e) {
            }
        };
        Table.prototype.Refresh = function () {
            this.InsertCellWrapper();
            try {
                this.GetReader().Serialize(true);
            }
            catch (e) {
                this.reader = new SexyTable.Reader(this);
            }
            if (this.sorter == null && this.container.hasClass('sortable')) {
                this.MakeSortable();
            }
            if (this.filterer == null && this.container.hasClass('filterable')) {
                this.MakeFilterable();
            }
            try {
                this.GetSizer().ForceResize();
            }
            catch (e) {
                this.sizer = new SexyTable.Sizer(this);
            }
            try {
                this.GetSearcher().BuildIndexes();
            }
            catch (e) {
                if (typeof lunr != 'undefined') {
                    this.MakeSearchable();
                }
            }
        };
        Table.prototype.GetRows = function () {
            return this.container.find('ul').not(this.container.find('.data-bind-template ul'));
        };
        Table.prototype.GetCells = function () {
            return this.container.find('li').not(this.container.find('.data-bind-template li'));
        };
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
var SexyTable;
(function (SexyTable) {
    var Writer = (function () {
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
        Writer.prototype.Append = function (viewmodel, directives) {
            var template = this.container.find('.data-bind-template');
            template.render(viewmodel, directives == null ? this.directives : directives);
            var newData = template.children('div').children().clone();
            template.find('*[id]').removeAttr('id');
            this.container.find('.tbody').append(newData);
            this.container.find('.tbody *[data-bind]').removeAttr('data-bind');
            this.table.Refresh();
        };
        Writer.prototype.Replace = function (viewmodel, directives) {
            this.container.find('.tbody').empty();
            this.Append(viewmodel, directives);
        };
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
