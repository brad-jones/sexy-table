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
    var Reader = (function () {
        function Reader(table) {
            this.table = table;
            this.container = this.table.GetContainer();
            this.Serialize();
        }
        Reader.prototype.GetHeadings = function () {
            return this.headings;
        };
        Reader.prototype.GetSerialized = function () {
            return this.serialized;
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
            this.originalTable = this.table.GetReader().GetSerialized().slice(0);
            this.BuildIndex();
        }
        Searcher.prototype.EnsureTableHasThead = function () {
            if (this.container.find('.thead, .tbody').length != 2) {
                throw new Error('Searchable tables MUST use .thead and .tbody containers!');
            }
        };
        Searcher.prototype.BuildIndex = function () {
            var data = this.table.GetReader().GetSerialized();
            var headings = this.table.GetReader().GetHeadings();
            this.index = lunr(function () {
                this.ref('_guid');
                for (var i = 0; i < headings.length; i++) {
                    if (headings[i] != '_guid' && headings[i] != '_dom') {
                        this.field(headings[i]);
                    }
                }
            });
            for (var row in data) {
                var document = {};
                for (var column in data[row]) {
                    if (column == '_guid') {
                        document[column] = data[row][column];
                    }
                    else if (column != '_dom') {
                        document[column] = column + ":" + data[row][column];
                    }
                }
                this.index.add(document);
            }
        };
        Searcher.prototype.Query = function (terms, column) {
            if (column === void 0) { column = 'all'; }
            if (terms == null || terms == "") {
                this.ResetTable();
                return;
            }
            var results = new Array();
            if (column == 'all') {
                var headings = this.table.GetReader().GetHeadings();
                for (var i = 0; i < headings.length; i++) {
                    if (headings[i] != '_guid' && headings[i] != '_dom') {
                        results = $.merge(results, this.index.search(headings[i] + ":" + terms));
                    }
                }
                results.sort(function (a, b) {
                    return b['score'] - a['score'];
                });
                var resultsNew = new Array();
                for (var key in results) {
                    var found = false;
                    for (var key2 in resultsNew) {
                        if (results[key].ref === resultsNew[key2].ref) {
                            found = true;
                            break;
                        }
                    }
                    if (!found)
                        resultsNew.push(results[key]);
                }
                results = resultsNew;
            }
            else {
                results = this.index.search(column + ":" + terms);
            }
            var rows = new Array();
            for (var result in results) {
                for (var row in this.originalTable) {
                    if (results[result].ref == this.originalTable[row]['_guid']) {
                        rows.push(this.originalTable[row]["_dom"]);
                    }
                }
            }
            this.container.find('.tbody').empty().append(rows);
            this.table.GetReader().Serialize();
            var icons = this.container.find('.thead i');
            icons.removeClass('fa-sort-asc');
            icons.removeClass('fa-sort-desc');
            icons.addClass('fa-sort');
        };
        Searcher.prototype.ResetTable = function () {
            var rows = new Array();
            for (var key in this.originalTable) {
                rows.push(this.originalTable[key]["_dom"]);
            }
            this.container.find('.tbody').empty().append(rows);
            this.table.GetReader().Serialize();
            var icons = this.container.find('.thead i');
            icons.removeClass('fa-sort-asc');
            icons.removeClass('fa-sort-desc');
            icons.addClass('fa-sort');
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
                    this.ReDrawTable(this.newTableData().sort(this.sortByKey($(cell).text().toLowerCase().replace(" ", "_"))));
                    break;
                case 'desc':
                    this.ReDrawTable(this.newTableData().sort(this.sortByKey($(cell).text().toLowerCase().replace(" ", "_"))).reverse());
                    break;
                default:
                    this.ReDrawTable(this.table.GetReader().GetSerialized());
            }
        };
        Sorter.prototype.ReDrawTable = function (data) {
            var rows = new Array();
            for (var row in data) {
                rows.push(data[row]["_dom"]);
            }
            this.container.find('.tbody').empty().append(rows);
        };
        Sorter.prototype.newTableData = function () {
            return this.table.GetReader().GetSerialized().slice(0);
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
            this.sizer = new SexyTable.Sizer(this);
            if (typeof lunr != 'undefined') {
                this.searcher = new SexyTable.Searcher(this);
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
            return this.sorter;
        };
        Table.prototype.GetSearcher = function () {
            return this.searcher;
        };
        Table.prototype.MakeSortable = function () {
            if (!this.container.hasClass('sortable')) {
                this.container.addClass('sortable');
            }
            this.sorter = new SexyTable.Sorter(this);
        };
        Table.prototype.InsertCellWrapper = function () {
            this.container.find('li').wrapInner('<div class="inner"></div>');
        };
        return Table;
    })();
    SexyTable.Table = Table;
})(SexyTable || (SexyTable = {}));
