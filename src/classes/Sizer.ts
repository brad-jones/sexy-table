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

module SexyTable
{
    /**
     * This is what emulates the auto sizing features of a normal HTML <table>.
     */
    export class Sizer
    {
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;

        /**
         * Give us the tables top level container element.
         * And we will make ensure it's rows & cells are sized correctly.
         */
        public constructor(protected table: Table)
        {
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
        public ForceResize(): void
        {
            this.container.width('100%');
            this.table.GetCells().removeData('dont-resize');
            this.table.GetCells().css('width', 'auto');
            this.table.GetRows().css('height', 'auto');
            this.SetWidthOfColumns();
            this.SetHeightOfRows();
        }

        /**
         * Loops through all rows in the table and sets their height.
         */
        protected SetHeightOfRows(): void
        {
            var that = this;

            this.table.GetRows().each(function(index, row)
            {
                $(row).css('height', that.CalculateRowHeight(row));
            });

            // Because the last row in the table also has a bottom border we
            // need to increase it's height by the height of the border.
            var last = this.table.GetRows().last();
            last.css('height', last.outerHeight(true) + this.GetRowBorder());
        }

        /**
         * Given a UL row element this will loop through all it's LI cells
         * and calculate the rows maximum height.
         */
        protected CalculateRowHeight(row: Element): number
        {
            var maxHeight = -1;

            $(row).find('li').each(function(index, cell)
            {
                if ($(cell).outerHeight(true) > maxHeight)
                {
                    maxHeight = $(cell).outerHeight(true);
                }
            });

            return maxHeight + this.GetRowBorder();
        }

        /**
         * Sets the width of each of the columns in the table.
         * This turned out to be much more complex that I first thought.
         * This method does have some duplicated code and I'm sure it's not as
         * efficent as it could be but for now it works.
         *
         * > TODO: At some point refactor this and code for performance.
         */
        protected SetWidthOfColumns(): void
        {
            // Get all our cells grouped by columns
            var columns = this.table.GetColumns();

            // Grab the natural width of each column
            var colWidths = [];
            columns.forEach(function(col)
            {
                var maxWidth = -1;

                col.forEach(function(cell)
                {
                    var cellWidth = $(cell).outerWidth(true);

                    if (cellWidth > maxWidth)
                    {
                        maxWidth = cellWidth;
                    }
                }, this);

                colWidths.push(maxWidth);
            }, this);

            // Sum up the widths
            var totalWidth = colWidths.reduce(function(a, b){ return a + b}, 0);

            // Now convert the column widths into percentages
            columns.forEach(function(col, colNo)
            {
                var width = ((colWidths[colNo] / totalWidth * 100) - 1) + '%';
                col.forEach(function(cell){ $(cell).css('width', width); });
            });

            // At this point the columns are sized with the correct ratios.
            // However we can obviously run into the issue where a cell
            // overflows. In this case we need to increase the width of the
            // column that the overflown cell belongs to but then remove the
            // width from other columns. This is a recursive process until we
            // have no more columns to resize.

            // Scope hack
            var that = this;

            // This is our recursive function, it's long and complicated.
            // I'll try and comment it as much as possible.
            var recursive = function()
            {
                // The number of pixels we need to remove
                // from the width of the table.
                var remove = 0;

                columns.forEach(function(col, colNo)
                {
                    // Get all the inner widths of each cell in the column
                    var widths = that.GetColWidths(col);

                    // Add the diff to the total amount we need to remove.
                    remove = remove + widths.diff;

                    // Set the width of each cell in the column to the maximum
                    col.forEach(function(cell)
                    {
                        if ($(cell).data('dont-resize') !== true)
                        {
                            $(cell).css('width', widths.max);
                        }

                        if (widths.diff > 0) $(cell).data('dont-resize', true);
                    });
                });

                // Work out how many columns we have that are still resizeable
                var resizeable_cols = that.GetResizeableCols();

                // Calculate the amount of width we need to
                // remove from each column.
                remove = remove / resizeable_cols;

                // In some cases we may find our selves with nothing
                // at all to resize. When this is set to true we have
                // reached the smallest size possible for the table.
                var nothingLeftToResize = true;

                columns.forEach(function(col, colNo)
                {
                    col.forEach(function(cell)
                    {
                        if ($(cell).data('dont-resize') !== true)
                        {
                            // We found a cell that we can resize
                            nothingLeftToResize = false;

                            // Set the new width of the cell
                            var newWidth = $(cell).outerWidth(true) - remove;
                            $(cell).css('width', newWidth);

                            // Check if we have overflown content.
                            var innerWidth = $(cell).find('.inner').outerWidth(true);
                            if (innerWidth > newWidth)
                            {
                                if (resizeable_cols > 1)
                                {
                                    // We have a cell that has overflown and we
                                    // have more than one resizeable column so
                                    // we will run ourselves again.
                                    recursive();
                                }
                                else
                                {
                                    // We have reached the minimum size of the
                                    // table. Thus we will set the widths of the
                                    // last resizeable column.
                                    col.forEach(function(cell1)
                                    {
                                        $(cell1).css('width', innerWidth);
                                        $(cell1).data('dont-resize', true);
                                    });

                                    // We have to do it twice so that we get the
                                    // correct size for the entire column.
                                    var finalWidth = that.GetColWidths(col).max;
                                    col.forEach(function(cell1)
                                    {
                                        $(cell1).css('width', finalWidth);
                                    });

                                    // Make sure the minium table size gets set
                                    nothingLeftToResize = true;
                                }
                            }
                        }
                    });
                });

                if (nothingLeftToResize)
                {
                    // Add up all the current column widths.
                    var minimumSize = 0;
                    var row = that.table.GetRows().first();
                    row.find('li').each(function(index, el)
                    {
                        minimumSize = minimumSize + $(el).outerWidth(true);
                    });

                    // Account for any border
                    minimumSize = minimumSize + (that.GetColumnBorder() * 2);

                    // Set the overall width of the sexy table.
                    // It will now overflow it's parent container
                    // just like a real table.
                    that.container.css('width', minimumSize);
                }
            };

            recursive();
        }

        /**
         * Counts the number of columns in the table that
         * still have space to spare and can be resized.
         */
        protected GetResizeableCols(): number
        {
            var resizeable_cols = this.GetNumberOfCols();

            this.table.GetColumns().forEach(function(col, colNo)
            {
                var dontRezise = false;

                col.forEach(function(cell)
                {
                    if ($(cell).data('dont-resize') === true)
                    {
                        dontRezise = true;
                    }
                });

                if (dontRezise) --resizeable_cols;
            });

            return resizeable_cols;
        }

        /**
         * Gets the inner widths of all cells in the provided column.
         * Performs some basic calcs on the widths and returns an object
         * for easy access to the results.
         */
        protected GetColWidths(col: Array<Element>): ColWidths
        {
            var widths = [];

            for (var i = 0; i < col.length; i++)
            {
                widths.push
                (
                    $(col[i]).find('.inner').outerWidth(true) +
                    this.GetColumnBorder()
                );
            }

            var min = Math.min.apply(null, widths);
            var max = Math.max.apply(null, widths);
            var diff = max - min;

            return { widths: widths, min: min, max: max, diff: diff };
        }

        /**
         * To make sure we don't overflow any rows of the table.
         * We need to cater for any borders. This assumes that the
         * same border is applied to all rows of the table.
         */
        protected GetRowBorder(): number
        {
            var row = this.container.find('ul').first();

            return row.outerWidth(true) - row.innerWidth();
        }

        /**
         * To make sure we don't overflow any cells of the table.
         * We need to cater for any borders. This assumes that the
         * same border is applied to all cells of the table.
         */
        protected GetColumnBorder(): number
        {
            var cell = this.container.find('li').first();

            return cell.outerWidth(true) - cell.innerWidth();
        }

        /**
         * To determine the width of each cell in the table it's a simple matter
         * of setting it's width to a percentage of the overall table width.
         * The browser will then easily take care of dyanmically adjusting the
         * width of the cells for us.
         */
        protected CalculateCellWidth(): string
        {
            return ((1 / this.GetNumberOfCols()) * 100) + '%';
        }

        /**
         * Gets the number of columns in the table.
         *
         * > NOTE: At the this stage the equivalent of colspans are not
         * > supported. The first UL row in the table is assumed to have
         * > the same number of LI cells as the rest of the table.
         */
        protected GetNumberOfCols(): number
        {
            return this.table.GetColumns().length;
        }

        /**
         * After all sizing functions have taken place, it's safe to show the
         * table, knowing it won't look like a dogs breakfast, regurgitated.
         */
        protected UnhideContainer(): void
        {
            this.container.css('visibility', 'visible');
        }
    }

    interface ColWidths
    {
        widths: Array<number>;
        min: number;
        max: number;
        diff: number;
    }
}
