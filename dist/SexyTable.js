var SexyTable;
(function (SexyTable) {
    SexyTable.AutoMakeSexy = true;
    function MakeTablesSexy() {
        $('.sexy-table').each(function (index, table) {
            new TableSizeCalculator(table);
        });
    }
    var TableSizeCalculator = (function () {
        function TableSizeCalculator(table, correctionFactor) {
            this.correctionFactor = 1.1;
            this.container = $(table);
            if (correctionFactor != null) {
                this.correctionFactor = correctionFactor;
            }
            this.InsertMissingCells();
            this.InsertCellWrapper();
            this.SetWidthOfCells();
            this.SetHeightOfRows();
            this.UnhideContainer();
            $(window).resize(this.SetWidthOfCells.bind(this));
            $(window).resize(this.SetHeightOfRows.bind(this));
        }
        TableSizeCalculator.prototype.InsertMissingCells = function () {
        };
        TableSizeCalculator.prototype.InsertCellWrapper = function () {
            this.container.find('li').wrapInner('<div class="inner"></div>');
        };
        TableSizeCalculator.prototype.SetHeightOfRows = function () {
            var that = this;
            this.container.find('ul').css('height', 'auto');
            this.container.find('ul').each(function (index, row) {
                $(row).css('height', that.CalculateRowHeight(row));
            });
        };
        TableSizeCalculator.prototype.CalculateRowHeight = function (row) {
            var maxHeight = -1;
            $(row).find('li').each(function (index, cell) {
                if ($(cell).outerHeight(true) > maxHeight) {
                    maxHeight = $(cell).outerHeight(true);
                }
            });
            return maxHeight;
        };
        TableSizeCalculator.prototype.SetWidthOfCells = function () {
            this.container.find('li').css('width', this.CalculateCellWidth());
        };
        TableSizeCalculator.prototype.CalculateCellWidth = function () {
            var cols = this.GetNumberOfCols();
            var width = this.GetTotalWidthOfTable();
            var padding = this.GetCellPadding();
            return (width / cols) - padding - this.correctionFactor;
        };
        TableSizeCalculator.prototype.UnhideContainer = function () {
            this.container.css('visibility', 'visible');
        };
        TableSizeCalculator.prototype.GetTotalWidthOfTable = function () {
            return this.container.innerWidth();
        };
        TableSizeCalculator.prototype.GetNumberOfCols = function () {
            return this.container.find('ul').first().find('li').length;
        };
        TableSizeCalculator.prototype.GetCellPadding = function () {
            var firstCell = this.container.find('li').first();
            return firstCell.outerWidth(true) - firstCell.width();
        };
        return TableSizeCalculator;
    })();
    SexyTable.TableSizeCalculator = TableSizeCalculator;
    $(document).ready(function () {
        if (SexyTable.AutoMakeSexy) {
            MakeTablesSexy();
        }
    });
})(SexyTable || (SexyTable = {}));
